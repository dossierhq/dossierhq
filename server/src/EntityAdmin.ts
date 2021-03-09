import { notOk, ok } from '@datadata/core';
import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityHistory,
  AdminEntityUpdate,
  AdminEntityVersionInfo,
  AdminQuery,
  Connection,
  Edge,
  ErrorType,
  Paging,
  PromiseResult,
  Result,
} from '@datadata/core';
import type { SessionContext } from '.';
import { toOpaqueCursor } from './Connection';
import * as Db from './Db';
import type { EntitiesTable, EntityVersionsTable } from './DbTableTypes';
import {
  decodeAdminEntity,
  encodeEntity,
  resolveCreateEntity,
  resolveUpdateEntity,
} from './EntityCodec';
import type { AdminEntityValues } from './EntityCodec';
import QueryBuilder from './QueryBuilder';
import { searchAdminEntitiesQuery, totalAdminEntitiesQuery } from './QueryGenerator';
import type { SearchAdminEntitiesItem } from './QueryGenerator';

export async function getEntity(
  context: SessionContext,
  id: string,
  version?: number | null
): PromiseResult<AdminEntity, ErrorType.NotFound> {
  let actualVersion: number;
  if (typeof version === 'number') {
    actualVersion = version;
  } else {
    const versionResult = await resolveMaxVersionForEntity(context, id);
    if (versionResult.isError()) {
      return versionResult;
    }
    actualVersion = versionResult.value.maxVersion;
  }
  const entityMain = await Db.queryNoneOrOne<AdminEntityValues>(
    context,
    `SELECT e.uuid, e.type, e.name, ev.version, ev.data
      FROM entities e, entity_versions ev
      WHERE e.uuid = $1
      AND e.id = ev.entities_id
      AND ev.version = $2`,
    [id, actualVersion]
  );
  if (!entityMain) {
    return notOk.NotFound('No such entity or version');
  }

  const entity = decodeAdminEntity(context, entityMain);

  return ok(entity);
}

export async function getEntities(
  context: SessionContext,
  ids: string[]
): Promise<Result<AdminEntity, ErrorType.NotFound>[]> {
  if (ids.length === 0) {
    return [];
  }

  const entitiesMain = await Db.queryMany<AdminEntityValues>(
    context,
    `SELECT e.uuid, e.type, e.name, ev.version, ev.data
      FROM entities e, entity_versions ev
      WHERE e.uuid = ANY($1)
      AND e.latest_draft_entity_versions_id = ev.id`,
    [ids]
  );

  const result: Result<AdminEntity, ErrorType.NotFound>[] = ids.map((id) => {
    const entityMain = entitiesMain.find((x) => x.uuid === id);
    if (!entityMain) {
      return notOk.NotFound('No such entity');
    }
    return ok(decodeAdminEntity(context, entityMain));
  });

  return result;
}

export async function searchEntities(
  context: SessionContext,
  query?: AdminQuery,
  paging?: Paging
): PromiseResult<Connection<Edge<AdminEntity, ErrorType>> | null, ErrorType.BadRequest> {
  const sqlQuery = searchAdminEntitiesQuery(context, query, paging);
  if (sqlQuery.isError()) {
    return sqlQuery;
  }
  const entitiesValues = await Db.queryMany<SearchAdminEntitiesItem>(context, sqlQuery.value);
  const hasExtraPage = entitiesValues.length > sqlQuery.value.pagingCount;
  if (hasExtraPage) {
    entitiesValues.splice(sqlQuery.value.pagingCount, 1);
  }

  if (!sqlQuery.value.isForwards) {
    // Reverse since DESC order returns the rows in the wrong order, we want them in the same order as for forwards pagination
    entitiesValues.reverse();
  }

  const entities = entitiesValues.map((x) => decodeAdminEntity(context, x));
  if (entities.length === 0) {
    return ok(null);
  }

  const { cursorName, cursorType } = sqlQuery.value;
  return ok({
    pageInfo: {
      hasNextPage: sqlQuery.value.isForwards ? hasExtraPage : false,
      hasPreviousPage: sqlQuery.value.isForwards ? false : hasExtraPage,
      startCursor: toOpaqueCursor(cursorType, entitiesValues[0][cursorName]),
      endCursor: toOpaqueCursor(cursorType, entitiesValues[entitiesValues.length - 1][cursorName]),
    },
    edges: entities.map((entity, index) => ({
      cursor: toOpaqueCursor(cursorType, entitiesValues[index][cursorName]),
      node: ok(entity),
    })),
  });
}

export async function getTotalCount(
  context: SessionContext,
  query?: AdminQuery
): PromiseResult<number, ErrorType.BadRequest> {
  const sqlQuery = totalAdminEntitiesQuery(context, query);
  if (sqlQuery.isError()) {
    return sqlQuery;
  }
  const { count } = await Db.queryOne<{ count: number }>(context, sqlQuery.value);
  return ok(count);
}

async function withUniqueNameAttempt<TResult>(
  context: SessionContext,
  name: string,
  attempt: (context: SessionContext, name: string) => Promise<TResult>
) {
  let potentiallyModifiedName = name;
  let first = true;
  for (let i = 0; i < 10; i += 1) {
    await Db.queryNone(
      context,
      first ? 'SAVEPOINT unique_name' : 'ROLLBACK TO SAVEPOINT unique_name; SAVEPOINT unique_name'
    );
    first = false;

    try {
      const result = await attempt(context, potentiallyModifiedName);
      // No exception => it's all good
      await Db.queryNone(context, 'RELEASE SAVEPOINT unique_name');

      return result;
    } catch (error) {
      if (
        error.name === 'error' &&
        error.message === 'duplicate key value violates unique constraint "entities_name_key"'
      ) {
        potentiallyModifiedName = `${name}#${Math.random().toFixed(8).slice(2)}`;
        continue;
      }
      throw error;
    }
  }
  throw new Error(`Failed creating a unique name for ${name}`);
}

export async function createEntity(
  context: SessionContext,
  entity: AdminEntityCreate
): PromiseResult<AdminEntity, ErrorType.BadRequest> {
  const resolvedResult = resolveCreateEntity(context, entity);
  if (resolvedResult.isError()) {
    return resolvedResult;
  }
  const createEntity = resolvedResult.value;

  const encodeResult = await encodeEntity(context, createEntity);
  if (encodeResult.isError()) {
    return encodeResult;
  }
  const { type, name, data, referenceIds, locations } = encodeResult.value;

  return await context.withTransaction(async (context) => {
    const { entityId } = await withUniqueNameAttempt(context, name, async (context, name) => {
      const { id: entityId, uuid } = await Db.queryOne<Pick<EntitiesTable, 'id' | 'uuid'>>(
        context,
        'INSERT INTO entities (name, type) VALUES ($1, $2) RETURNING id, uuid',
        [name, type]
      );
      createEntity.id = uuid;
      createEntity._name = name;
      return { entityId };
    });

    const { id: versionsId } = await Db.queryOne<{ id: number }>(
      context,
      'INSERT INTO entity_versions (entities_id, version, created_by, data) VALUES ($1, 0, $2, $3) RETURNING id',
      [entityId, context.session.subjectInternalId, data]
    );
    await Db.queryNone(
      context,
      'UPDATE entities SET latest_draft_entity_versions_id = $1 WHERE id = $2',
      [versionsId, entityId]
    );
    if (referenceIds.length > 0) {
      const qb = new QueryBuilder(
        'INSERT INTO entity_version_references (entity_versions_id, entities_id) VALUES',
        [versionsId]
      );
      for (const referenceId of referenceIds) {
        qb.addQuery(`($1, ${qb.addValue(referenceId)})`);
      }
      await Db.queryNone(context, qb.build());
    }
    if (locations.length > 0) {
      const qb = new QueryBuilder(
        'INSERT INTO entity_version_locations (entity_versions_id, location) VALUES',
        [versionsId]
      );
      for (const location of locations) {
        qb.addQuery(
          `($1, ST_SetSRID(ST_Point(${qb.addValue(location.lng)}, ${qb.addValue(
            location.lat
          )}), 4326))`
        );
      }
      await Db.queryNone(context, qb.build());
    }

    return ok(createEntity as AdminEntity);
  });
}

export async function updateEntity(
  context: SessionContext,
  entity: AdminEntityUpdate
): PromiseResult<AdminEntity, ErrorType.BadRequest | ErrorType.NotFound> {
  return await context.withTransaction(async (context) => {
    const previousValues = await Db.queryNoneOrOne<
      Pick<EntitiesTable, 'id' | 'type' | 'name'> & Pick<EntityVersionsTable, 'version' | 'data'>
    >(
      context,
      `SELECT e.id, e.type, e.name, ev.version, ev.data
        FROM entities e, entity_versions ev
        WHERE e.uuid = $1 AND e.latest_draft_entity_versions_id = ev.id`,
      [entity.id]
    );
    if (!previousValues) {
      return notOk.NotFound('No such entity');
    }
    const { id: entityId, data: previousDataEncoded, type, name: previousName } = previousValues;
    const newVersion = previousValues.version + 1;

    const resolvedResult = resolveUpdateEntity(
      context,
      entity,
      type,
      previousName,
      newVersion,
      previousDataEncoded
    );
    if (resolvedResult.isError()) {
      return resolvedResult;
    }
    const updatedEntity = resolvedResult.value;

    const encodeResult = await encodeEntity(context, updatedEntity);
    if (encodeResult.isError()) {
      return encodeResult;
    }
    const { data, name, referenceIds, locations } = encodeResult.value;

    const { id: versionsId } = await Db.queryOne<Pick<EntityVersionsTable, 'id'>>(
      context,
      'INSERT INTO entity_versions (entities_id, created_by, version, data) VALUES ($1, $2, $3, $4) RETURNING id',
      [entityId, context.session.subjectInternalId, newVersion, data]
    );

    if (name !== previousName) {
      await withUniqueNameAttempt(context, name, async (context, name) => {
        await Db.queryNone(context, 'UPDATE entities SET name = $1 WHERE id = $2', [
          name,
          entityId,
        ]);
        updatedEntity._name = name;
      });
    }

    await Db.queryNone(
      context,
      'UPDATE entities SET latest_draft_entity_versions_id = $1 WHERE id = $2',
      [versionsId, entityId]
    );

    if (referenceIds.length > 0) {
      const qb = new QueryBuilder(
        'INSERT INTO entity_version_references (entity_versions_id, entities_id) VALUES',
        [versionsId]
      );
      for (const referenceId of referenceIds) {
        qb.addQuery(`($1, ${qb.addValue(referenceId)})`);
      }
      await Db.queryNone(context, qb.build());
    }

    if (locations.length > 0) {
      const qb = new QueryBuilder(
        'INSERT INTO entity_version_locations (entity_versions_id, location) VALUES',
        [versionsId]
      );
      for (const location of locations) {
        qb.addQuery(
          `($1, ST_SetSRID(ST_Point(${qb.addValue(location.lng)}, ${qb.addValue(
            location.lat
          )}), 4326))`
        );
      }
      await Db.queryNone(context, qb.build());
    }

    return ok(updatedEntity);
  });
}

export async function deleteEntity(
  context: SessionContext,
  id: string
): PromiseResult<AdminEntity, ErrorType.NotFound> {
  return await context.withTransaction(async (context) => {
    // Entity info
    const entityInfo = await Db.queryNoneOrOne<
      Pick<EntitiesTable, 'id' | 'name' | 'type'> & Pick<EntityVersionsTable, 'version'>
    >(
      context,
      `SELECT e.id, e.name, e.type, ev.version
        FROM entity_versions ev, entities e
        WHERE e.uuid = $1 AND e.latest_draft_entity_versions_id = ev.id`,
      [id]
    );
    if (!entityInfo) {
      return notOk.NotFound('No such entity');
    }
    const { id: entityId, name, type, version: maxVersion } = entityInfo;

    const version = maxVersion + 1;
    const { id: versionsId } = await Db.queryOne<{ id: number }>(
      context,
      'INSERT INTO entity_versions (entities_id, created_by, version) VALUES ($1, $2, $3) RETURNING id',
      [entityId, context.session.subjectInternalId, version]
    );
    await Db.queryNone(
      context,
      'UPDATE entities SET latest_draft_entity_versions_id = $1 WHERE id = $2',
      [versionsId, entityId]
    );
    return ok(decodeAdminEntity(context, { uuid: id, type, name, version, data: null }));
  });
}

export async function publishEntity(
  context: SessionContext,
  id: string,
  version: number
): PromiseResult<void, ErrorType.BadRequest | ErrorType.NotFound> {
  const result = await Db.queryNoneOrOne<
    Pick<EntityVersionsTable, 'id' | 'entities_id'> & { deleted: boolean }
  >(
    context,
    `SELECT ev.id, ev.entities_id, ev.data IS NULL as deleted
      FROM entity_versions ev, entities e
      WHERE e.uuid = $1 AND e.id = ev.entities_id
        AND ev.version = $2`,
    [id, version]
  );

  if (!result) {
    return notOk.NotFound('No such entity');
  }

  const { id: versionsId, entities_id: entityId, deleted } = result;

  if (deleted) {
    const publishedReferences = await Db.queryMany<Pick<EntitiesTable, 'uuid'>>(
      context,
      `SELECT e.uuid
        FROM entity_version_references evr, entity_versions ev, entities e
        WHERE evr.entities_id = $1
          AND evr.entity_versions_id = ev.id
          AND ev.entities_id = e.id
          AND e.published_entity_versions_id = ev.id`,
      [entityId]
    );
    if (publishedReferences.length > 0) {
      return notOk.BadRequest(
        `Referenced by published entities: ${publishedReferences
          .map(({ uuid }) => uuid)
          .join(', ')}`
      );
    }
  } else {
    const unpublishedReferences = await Db.queryMany<Pick<EntitiesTable, 'uuid'>>(
      context,
      `SELECT e.uuid
       FROM entity_version_references evr, entities e
       WHERE evr.entity_versions_id = $1
       AND evr.entities_id = e.id
       AND (e.published_deleted OR e.published_entity_versions_id IS NULL)`,
      [versionsId]
    );
    if (unpublishedReferences.length > 0) {
      return notOk.BadRequest(
        `References unpublished entities: ${unpublishedReferences
          .map(({ uuid }) => uuid)
          .join(', ')}`
      );
    }
  }

  await Db.queryNone(
    context,
    'UPDATE entities SET published_entity_versions_id = $1, published_deleted = $2 WHERE id = $3',
    [versionsId, deleted, entityId]
  );
  return ok(undefined);
}

export async function publishEntities(
  context: SessionContext,
  entities: {
    id: string;
    version: number;
  }[]
): PromiseResult<void, ErrorType.BadRequest | ErrorType.NotFound> {
  return context.withTransaction(async (context) => {
    // Step 1: Get version info for each entity
    const missingEntities: { id: string; version: number }[] = [];
    const versionsInfo: { versionsId: number; entityId: number; deleted: boolean }[] = [];
    for (const { id, version } of entities) {
      const versionInfo = await Db.queryNoneOrOne<
        Pick<EntityVersionsTable, 'id' | 'entities_id'> & { deleted: boolean }
      >(
        context,
        `SELECT ev.id, ev.entities_id, ev.data IS NULL as deleted
         FROM entity_versions ev, entities e
         WHERE e.uuid = $1 AND e.id = ev.entities_id
           AND ev.version = $2`,
        [id, version]
      );

      if (versionInfo) {
        versionsInfo.push({
          versionsId: versionInfo.id,
          entityId: versionInfo.entities_id,
          deleted: versionInfo.deleted,
        });
      } else {
        missingEntities.push({ id, version });
      }
    }
    if (missingEntities.length > 0) {
      return notOk.NotFound(`No such entities: ${missingEntities.map(({ id }) => id).join(', ')}`);
    }

    // Step 2: Publish entities
    for (const { versionsId, deleted, entityId } of versionsInfo) {
      await Db.queryNone(
        context,
        'UPDATE entities SET published_entity_versions_id = $1, published_deleted = $2 WHERE id = $3',
        [versionsId, deleted, entityId]
      );
    }

    // Step 3: Check if references are ok
    for (const { versionsId, deleted, entityId } of versionsInfo) {
      if (deleted) {
        const publishedReferences = await Db.queryMany<Pick<EntitiesTable, 'uuid'>>(
          context,
          `SELECT e.uuid
           FROM entity_version_references evr, entity_versions ev, entities e
           WHERE evr.entities_id = $1
             AND evr.entity_versions_id = ev.id
             AND ev.entities_id = e.id
             AND e.published_entity_versions_id = ev.id`,
          [entityId]
        );
        if (publishedReferences.length > 0) {
          return notOk.BadRequest(
            `Referenced by published entities: ${publishedReferences
              .map(({ uuid }) => uuid)
              .join(', ')}`
          );
        }
      } else {
        const unpublishedReferences = await Db.queryMany<Pick<EntitiesTable, 'uuid'>>(
          context,
          `SELECT e.uuid
           FROM entity_version_references evr, entities e
           WHERE evr.entity_versions_id = $1
             AND evr.entities_id = e.id
             AND (e.published_deleted OR e.published_entity_versions_id IS NULL)`,
          [versionsId]
        );
        if (unpublishedReferences.length > 0) {
          return notOk.BadRequest(
            `References unpublished entities: ${unpublishedReferences
              .map(({ uuid }) => uuid)
              .join(', ')}`
          );
        }
      }
    }

    return ok(undefined);
  });
}

async function resolveMaxVersionForEntity(
  context: SessionContext,
  id: string
): PromiseResult<{ entityId: number; maxVersion: number }, ErrorType.NotFound> {
  const result = await Db.queryNoneOrOne<Pick<EntityVersionsTable, 'entities_id' | 'version'>>(
    context,
    `SELECT ev.entities_id, ev.version
      FROM entity_versions ev, entities e
      WHERE e.uuid = $1 AND e.latest_draft_entity_versions_id = ev.id`,
    [id]
  );
  if (!result) {
    return notOk.NotFound('No such entity');
  }
  return ok({ entityId: result.entities_id, maxVersion: result.version });
}

export async function getEntityHistory(
  context: SessionContext,
  id: string
): PromiseResult<AdminEntityHistory, ErrorType.NotFound> {
  const entityMain = await Db.queryNoneOrOne<
    Pick<EntitiesTable, 'id' | 'uuid' | 'type' | 'name' | 'published_entity_versions_id'>
  >(
    context,
    `SELECT id, uuid, type, name, published_entity_versions_id
      FROM entities e
      WHERE uuid = $1`,
    [id]
  );
  if (!entityMain) {
    return notOk.NotFound('No such entity');
  }

  const versions = await Db.queryMany<
    Pick<EntityVersionsTable, 'id' | 'version' | 'created_at'> & {
      created_by_uuid: string;
      deleted: boolean;
    }
  >(
    context,
    `SELECT
      ev.id,
      ev.version,
      ev.created_at,
      s.uuid AS created_by_uuid,
      ev.data IS NULL as deleted
     FROM entity_versions ev, subjects s
     WHERE ev.entities_id = $1 AND ev.created_by = s.id
     ORDER BY ev.version`,
    [entityMain.id]
  );

  const result: AdminEntityHistory = {
    id: entityMain.uuid,
    type: entityMain.type,
    name: entityMain.name,
    versions: versions.map<AdminEntityVersionInfo>((v) => ({
      version: v.version,
      deleted: v.deleted,
      published: v.id === entityMain.published_entity_versions_id,
      createdBy: v.created_by_uuid,
      createdAt: v.created_at,
    })),
  };
  return ok(result);
}
