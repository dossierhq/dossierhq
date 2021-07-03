import { EntityPublishState, notOk, ok } from '@datadata/core';
import type {
  AdminEntity2,
  AdminEntityCreate2,
  AdminEntityUpdate2,
  AdminQuery,
  Connection,
  Edge,
  EntityHistory,
  EntityVersionInfo,
  ErrorType,
  Paging,
  PromiseResult,
  PublishingEvent,
  PublishingEventKind,
  PublishingHistory,
  PublishingResult,
  Result,
} from '@datadata/core';
import type { SessionContext } from '.';
import { toOpaqueCursor } from './Connection';
import * as Db from './Database';
import type {
  EntitiesTable,
  EntityPublishingEventsTable,
  EntityVersionsTable,
} from './DatabaseTables';
import {
  decodeAdminEntity,
  encodeEntity,
  resolveCreateEntity,
  resolvePublishState,
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
): PromiseResult<AdminEntity2, ErrorType.NotFound> {
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
    `SELECT e.uuid, e.type, e.name, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
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
): Promise<Result<AdminEntity2, ErrorType.NotFound>[]> {
  if (ids.length === 0) {
    return [];
  }

  const entitiesMain = await Db.queryMany<AdminEntityValues>(
    context,
    `SELECT e.uuid, e.type, e.name, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
      FROM entities e, entity_versions ev
      WHERE e.uuid = ANY($1)
      AND e.latest_draft_entity_versions_id = ev.id`,
    [ids]
  );

  const result: Result<AdminEntity2, ErrorType.NotFound>[] = ids.map((id) => {
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
): PromiseResult<Connection<Edge<AdminEntity2, ErrorType>> | null, ErrorType.BadRequest> {
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

  const entities = entitiesValues.map((it) => decodeAdminEntity(context, it));
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
  entity: AdminEntityCreate2
): PromiseResult<AdminEntity2, ErrorType.BadRequest> {
  const resolvedResult = resolveCreateEntity(context, entity);
  if (resolvedResult.isError()) {
    return resolvedResult;
  }
  const createEntity = resolvedResult.value;

  const encodeResult = await encodeEntity(context, createEntity);
  if (encodeResult.isError()) {
    return encodeResult;
  }
  const { type, name, data, referenceIds, locations, fullTextSearchText } = encodeResult.value;

  return await context.withTransaction(async (context) => {
    const { uuid, actualName, entityId } = await withUniqueNameAttempt(
      context,
      name,
      async (context, name) => {
        const qb = new QueryBuilder('INSERT INTO entities (uuid, name, type, latest_fts)');
        qb.addQuery(
          `VALUES (${qb.addValueOrDefault(entity.id)}, ${qb.addValue(name)}, ${qb.addValue(
            type
          )}, to_tsvector(${qb.addValue(fullTextSearchText.join(' '))}))`
        );
        qb.addQuery('RETURNING id, uuid');
        const { id: entityId, uuid } = await Db.queryOne<Pick<EntitiesTable, 'id' | 'uuid'>>(
          context,
          qb.build()
        );
        return { uuid, actualName: name, entityId };
      }
    );

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

    const result: AdminEntity2 = {
      id: uuid,
      info: {
        ...createEntity.info,
        name: actualName,
        publishingState: EntityPublishState.Draft,
        version: 0,
      },
      fields: createEntity.fields ?? {},
    };
    return ok(result);
  });
}

export async function updateEntity(
  context: SessionContext,
  entity: AdminEntityUpdate2
): PromiseResult<AdminEntity2, ErrorType.BadRequest | ErrorType.NotFound> {
  return await context.withTransaction(async (context) => {
    const previousValues = await Db.queryNoneOrOne<
      Pick<
        EntitiesTable,
        'id' | 'type' | 'name' | 'archived' | 'never_published' | 'published_entity_versions_id'
      > &
        Pick<EntityVersionsTable, 'version' | 'data'>
    >(
      context,
      `SELECT e.id, e.type, e.name, e.archived, e.never_published, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev
        WHERE e.uuid = $1 AND e.latest_draft_entity_versions_id = ev.id`,
      [entity.id]
    );
    if (!previousValues) {
      return notOk.NotFound('No such entity');
    }
    const { id: entityId, type, name: previousName } = previousValues;

    const resolvedResult = resolveUpdateEntity(context, entity, type, previousValues);
    if (resolvedResult.isError()) {
      return resolvedResult;
    }
    const updatedEntity = resolvedResult.value;

    const encodeResult = await encodeEntity(context, updatedEntity);
    if (encodeResult.isError()) {
      return encodeResult;
    }
    const { data, name, referenceIds, locations, fullTextSearchText } = encodeResult.value;

    const { id: versionsId } = await Db.queryOne<Pick<EntityVersionsTable, 'id'>>(
      context,
      'INSERT INTO entity_versions (entities_id, created_by, version, data) VALUES ($1, $2, $3, $4) RETURNING id',
      [entityId, context.session.subjectInternalId, updatedEntity.info.version, data]
    );

    if (name !== previousName) {
      await withUniqueNameAttempt(context, name, async (context, name) => {
        await Db.queryNone(context, 'UPDATE entities SET name = $1 WHERE id = $2', [
          name,
          entityId,
        ]);
        updatedEntity.info.name = name;
      });
    }

    await Db.queryNone(
      context,
      'UPDATE entities SET latest_draft_entity_versions_id = $1, latest_fts = to_tsvector($2) WHERE id = $3',
      [versionsId, fullTextSearchText.join(' '), entityId]
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

export async function publishEntities(
  context: SessionContext,
  entities: {
    id: string;
    version: number;
  }[]
): PromiseResult<PublishingResult[], ErrorType.BadRequest | ErrorType.NotFound> {
  const uniqueIdCheck = checkUUIDsAreUnique(entities.map((it) => it.id));
  if (uniqueIdCheck.isError()) {
    return uniqueIdCheck;
  }

  return context.withTransaction(async (context) => {
    // Step 1: Get version info for each entity
    const missingEntities: { id: string; version: number }[] = [];
    const alreadyPublishedEntityIds: string[] = [];
    const versionsInfo: {
      uuid: string;
      versionsId: number;
      entityId: number;
    }[] = [];
    for (const { id, version } of entities) {
      const versionInfo = await Db.queryNoneOrOne<
        Pick<EntityVersionsTable, 'id' | 'entities_id'> &
          Pick<EntitiesTable, 'published_entity_versions_id'>
      >(
        context,
        `SELECT ev.id, ev.entities_id, e.published_entity_versions_id
         FROM entity_versions ev, entities e
         WHERE e.uuid = $1 AND e.id = ev.entities_id
           AND ev.version = $2`,
        [id, version]
      );

      if (!versionInfo) {
        missingEntities.push({ id, version });
      } else if (versionInfo.published_entity_versions_id === versionInfo.id) {
        alreadyPublishedEntityIds.push(id);
      } else {
        versionsInfo.push({
          uuid: id,
          versionsId: versionInfo.id,
          entityId: versionInfo.entities_id,
        });
      }
    }
    if (missingEntities.length > 0) {
      return notOk.NotFound(`No such entities: ${missingEntities.map(({ id }) => id).join(', ')}`);
    }
    if (alreadyPublishedEntityIds.length > 0) {
      return notOk.BadRequest(
        `Entity versions are already published: ${alreadyPublishedEntityIds.join(', ')}`
      );
    }

    // Step 2: Publish entities
    for (const { versionsId, entityId } of versionsInfo) {
      await Db.queryNone(
        context,
        'UPDATE entities SET never_published = FALSE, archived = FALSE, published_entity_versions_id = $1 WHERE id = $2',
        [versionsId, entityId]
      );
    }

    // Step 3: Check if references are ok
    const referenceErrorMessages: string[] = [];
    for (const { uuid, versionsId } of versionsInfo) {
      const unpublishedReferences = await Db.queryMany<Pick<EntitiesTable, 'uuid'>>(
        context,
        `SELECT e.uuid
           FROM entity_version_references evr, entities e
           WHERE evr.entity_versions_id = $1
             AND evr.entities_id = e.id
             AND e.published_entity_versions_id IS NULL`,
        [versionsId]
      );
      if (unpublishedReferences.length > 0) {
        referenceErrorMessages.push(
          `${uuid}: References unpublished entities: ${unpublishedReferences
            .map(({ uuid }) => uuid)
            .join(', ')}`
        );
      }
    }

    if (referenceErrorMessages.length > 0) {
      return notOk.BadRequest(referenceErrorMessages.join('\n'));
    }

    // Step 4: Create publish event
    const qb = new QueryBuilder(
      'INSERT INTO entity_publishing_events (entities_id, entity_versions_id, published_by, kind) VALUES'
    );
    const subjectValue = qb.addValue(context.session.subjectInternalId);
    for (const versionInfo of versionsInfo) {
      qb.addQuery(
        `(${qb.addValue(versionInfo.entityId)}, ${qb.addValue(
          versionInfo.versionsId
        )}, ${subjectValue}, 'publish')`
      );
    }
    await Db.queryNone(context, qb.build());

    //
    return ok(entities.map(({ id }) => ({ id, publishState: EntityPublishState.Published })));
  });
}

export async function unpublishEntities(
  context: SessionContext,
  entityIds: string[]
): PromiseResult<PublishingResult[], ErrorType.BadRequest | ErrorType.NotFound> {
  const uniqueIdCheck = checkUUIDsAreUnique(entityIds);
  if (uniqueIdCheck.isError()) {
    return uniqueIdCheck;
  }

  return context.withTransaction(async (context) => {
    // Step 1: Resolve entities and check if all entities exist
    const entitiesInfo = await Db.queryMany<
      Pick<EntitiesTable, 'id' | 'uuid' | 'published_entity_versions_id'>
    >(
      context,
      'SELECT e.id, e.uuid, e.published_entity_versions_id FROM entities e WHERE e.uuid = ANY($1)',
      [entityIds]
    );

    const missingEntityIds = entityIds.filter(
      (entityId) => !entitiesInfo.find((it) => it.uuid === entityId)
    );
    if (missingEntityIds.length > 0) {
      return notOk.NotFound(`No such entities: ${missingEntityIds.join(', ')}`);
    }

    const unpublishedEntities = entitiesInfo
      .filter((it) => it.published_entity_versions_id === null)
      .map((it) => it.uuid);
    if (unpublishedEntities.length > 0) {
      return notOk.BadRequest(`Entities are not published: ${unpublishedEntities.join(', ')}`);
    }

    // Step 2: Unpublish entities
    await Db.queryNone(
      context,
      'UPDATE entities SET published_entity_versions_id = NULL WHERE id = ANY($1)',
      [entitiesInfo.map((it) => it.id)]
    );

    // Step 3: Check if references are ok
    const referenceErrorMessages: string[] = [];
    for (const { id, uuid } of entitiesInfo) {
      const publishedIncomingReferences = await Db.queryMany<Pick<EntitiesTable, 'uuid'>>(
        context,
        `SELECT e.uuid
           FROM entity_version_references evr, entity_versions ev, entities e
           WHERE evr.entities_id = $1
             AND evr.entity_versions_id = ev.id
             AND ev.entities_id = e.id
             AND e.published_entity_versions_id = ev.id`,
        [id]
      );
      if (publishedIncomingReferences.length > 0) {
        referenceErrorMessages.push(
          `${uuid}: Published entities referencing entity: ${publishedIncomingReferences
            .map(({ uuid }) => uuid)
            .join(', ')}`
        );
      }
    }

    if (referenceErrorMessages.length > 0) {
      return notOk.BadRequest(referenceErrorMessages.join('\n'));
    }

    // Step 4: Create publish event
    const qb = new QueryBuilder(
      'INSERT INTO entity_publishing_events (entities_id, entity_versions_id, published_by, kind) VALUES'
    );
    const subjectValue = qb.addValue(context.session.subjectInternalId);
    for (const entityInfo of entitiesInfo) {
      qb.addQuery(`(${qb.addValue(entityInfo.id)}, NULL, ${subjectValue}, 'unpublish')`);
    }
    await Db.queryNone(context, qb.build());

    //
    return ok(entityIds.map((id) => ({ id, publishState: EntityPublishState.Withdrawn })));
  });
}

export async function archiveEntity(
  context: SessionContext,
  id: string
): PromiseResult<PublishingResult, ErrorType.BadRequest | ErrorType.NotFound> {
  return context.withTransaction(async (context) => {
    const entityInfo = await Db.queryNoneOrOne<
      Pick<EntitiesTable, 'id' | 'published_entity_versions_id' | 'archived'>
    >(
      context,
      'SELECT e.id, e.published_entity_versions_id, e.archived FROM entities e WHERE e.uuid = $1',
      [id]
    );

    if (!entityInfo) {
      return notOk.NotFound('No such entity');
    }
    const { id: entityId, published_entity_versions_id: publishedVersionId, archived } = entityInfo;

    if (publishedVersionId) {
      return notOk.BadRequest('Entity is published');
    }
    if (archived) {
      return ok({ id, publishState: EntityPublishState.Archived }); // no change
    }

    await Promise.all([
      Db.queryNone(context, 'UPDATE entities SET archived = TRUE WHERE id = $1', [entityId]),
      Db.queryNone(
        context,
        "INSERT INTO entity_publishing_events (entities_id, kind, published_by) VALUES ($1, 'archive', $2)",
        [entityId, context.session.subjectInternalId]
      ),
    ]);

    return ok({ id, publishState: EntityPublishState.Archived });
  });
}

export async function unarchiveEntity(
  context: SessionContext,
  id: string
): PromiseResult<PublishingResult, ErrorType.BadRequest | ErrorType.NotFound> {
  return context.withTransaction(async (context) => {
    const entityInfo = await Db.queryNoneOrOne<
      Pick<
        EntitiesTable,
        | 'id'
        | 'archived'
        | 'latest_draft_entity_versions_id'
        | 'never_published'
        | 'published_entity_versions_id'
      >
    >(
      context,
      `SELECT id, archived, latest_draft_entity_versions_id, never_published, published_entity_versions_id
       FROM entities WHERE uuid = $1`,
      [id]
    );

    if (!entityInfo) {
      return notOk.NotFound('No such entity');
    }
    const { id: entityId, archived } = entityInfo;

    if (archived) {
      await Promise.all([
        Db.queryNone(context, 'UPDATE entities SET archived = FALSE WHERE id = $1', [entityId]),
        Db.queryNone(
          context,
          "INSERT INTO entity_publishing_events (entities_id, kind, published_by) VALUES ($1, 'unarchive', $2)",
          [entityId, context.session.subjectInternalId]
        ),
      ]);
    }

    return ok({
      id,
      publishState: resolvePublishState({ ...entityInfo, archived: false }, entityInfo),
    });
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

function checkUUIDsAreUnique(uuids: string[]): Result<void, ErrorType.BadRequest> {
  const unique = new Set<string>();
  for (const uuid of uuids) {
    if (unique.has(uuid)) {
      return notOk.BadRequest(`Duplicate ids: ${uuid}`);
    }
    unique.add(uuid);
  }
  return ok(undefined);
}

export async function getEntityHistory(
  context: SessionContext,
  id: string
): PromiseResult<EntityHistory, ErrorType.NotFound> {
  const entityMain = await Db.queryNoneOrOne<
    Pick<EntitiesTable, 'id' | 'uuid' | 'published_entity_versions_id'>
  >(
    context,
    `SELECT id, uuid, published_entity_versions_id
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
    }
  >(
    context,
    `SELECT
      ev.id,
      ev.version,
      ev.created_at,
      s.uuid AS created_by_uuid
     FROM entity_versions ev, subjects s
     WHERE ev.entities_id = $1 AND ev.created_by = s.id
     ORDER BY ev.version`,
    [entityMain.id]
  );

  const result: EntityHistory = {
    id: entityMain.uuid,
    versions: versions.map<EntityVersionInfo>((v) => ({
      version: v.version,
      published: v.id === entityMain.published_entity_versions_id,
      createdBy: v.created_by_uuid,
      createdAt: v.created_at,
    })),
  };
  return ok(result);
}

export async function getPublishingHistory(
  context: SessionContext,
  id: string
): PromiseResult<PublishingHistory, ErrorType.NotFound> {
  const entityInfo = await Db.queryNoneOrOne<Pick<EntitiesTable, 'id'>>(
    context,
    'SELECT id FROM entities WHERE uuid = $1',
    [id]
  );
  if (!entityInfo) {
    return notOk.NotFound('No such entity');
  }

  const publishEvents = await Db.queryMany<
    Pick<EntityVersionsTable, 'version'> &
      Pick<EntityPublishingEventsTable, 'published_at' | 'kind'> & {
        published_by: string;
      }
  >(
    context,
    `SELECT ev.version, s.uuid AS published_by, epe.published_at, epe.kind
      FROM entity_publishing_events epe
        LEFT OUTER JOIN entity_versions ev ON (epe.entity_versions_id = ev.id)
        INNER JOIN subjects s ON (epe.published_by = s.id)
      WHERE epe.entities_id = $1
      ORDER BY epe.published_at`,
    [entityInfo.id]
  );
  return ok({
    id,
    events: publishEvents.map((it) => {
      const event: PublishingEvent = {
        version: it.version,
        kind: it.kind as PublishingEventKind,
        publishedAt: it.published_at,
        publishedBy: it.published_by,
      };
      return event;
    }),
  });
}
