import type { Connection, Edge, ErrorType, Paging, PromiseResult, SessionContext } from '.';
import { notOk, ok } from '.';
import { toOpaqueCursor } from './Connection';
import * as Db from './Db';
import type { EntitiesTable, EntityVersionsTable } from './DbTableTypes';
import { decodeAdminEntity, encodeEntity, resolveEntity } from './EntityCodec';
import type { AdminEntityValues } from './EntityCodec';
import QueryBuilder from './QueryBuilder';
import { searchAdminEntitiesQuery, totalAdminEntitiesQuery } from './QueryGenerator';

export interface EntityHistory {
  id: string;
  type: string;
  name: string;
  versions: {
    version: number;
    isDelete: boolean;
    isPublished: boolean;
    createdBy: string;
    createdAt: Date;
  }[];
}

export interface AdminEntity {
  /** UUIDv4 */
  id: string;
  _name: string;
  _type: string;
  _version: number;
  [fieldName: string]: unknown;
}

export interface AdminEntityCreate {
  // /** UUIDv4 */
  //TODO  id?: string;
  _name: string;
  _type: string;
  [fieldName: string]: unknown;
}

export interface AdminEntityUpdate {
  /** UUIDv4 */
  id: string;
  _name?: string;
  /** If provided, has to be same as the entities existing type, i.e. there's no way to change the type of an entity */
  _type?: string;
  [fieldName: string]: unknown;
}

export interface AdminFilter {
  entityTypes?: string[];
}

export async function getEntity(
  context: SessionContext,
  id: string,
  options: { version?: number | null }
): PromiseResult<{ item: AdminEntity }, ErrorType.NotFound> {
  let version: number;
  if (typeof options.version === 'number') {
    version = options.version;
  } else {
    const versionResult = await resolveMaxVersionForEntity(context, id);
    if (versionResult.isError()) {
      return versionResult;
    }
    version = versionResult.value.maxVersion;
  }
  const entityMain = await Db.queryNoneOrOne<AdminEntityValues>(
    context,
    `SELECT e.uuid, e.type, e.name, ev.version, ev.data
      FROM entities e, entity_versions ev
      WHERE e.uuid = $1
      AND e.id = ev.entities_id
      AND ev.version = $2`,
    [id, version]
  );
  if (!entityMain) {
    return notOk.NotFound('No such entity or version');
  }

  const entity = decodeAdminEntity(context, entityMain);

  return ok({
    item: entity,
  });
}

export async function searchEntities(
  context: SessionContext,
  filter?: AdminFilter,
  paging?: Paging
): PromiseResult<Connection<Edge<AdminEntity, ErrorType>> | null, ErrorType.BadRequest> {
  const query = searchAdminEntitiesQuery(context, filter, paging);
  if (query.isError()) {
    return query;
  }
  const entitiesValues = await Db.queryMany<Pick<EntitiesTable, 'id'> & AdminEntityValues>(
    context,
    query.value
  );
  const hasExtraPage = entitiesValues.length > query.value.pagingCount;
  if (hasExtraPage) {
    entitiesValues.splice(query.value.pagingCount, 1);
  }

  if (!query.value.isForwards) {
    // Reverse since DESC order returns the rows in the wrong order, we want them in the same order as for forwards pagination
    entitiesValues.reverse();
  }

  const entities = entitiesValues.map((x) => decodeAdminEntity(context, x));
  if (entities.length === 0) {
    return ok(null);
  }
  return ok({
    pageInfo: {
      hasNextPage: query.value.isForwards ? hasExtraPage : false,
      hasPreviousPage: query.value.isForwards ? false : hasExtraPage,
      startCursor: toOpaqueCursor(entitiesValues[0].id),
      endCursor: toOpaqueCursor(entitiesValues[entitiesValues.length - 1].id),
    },
    edges: entities.map((entity, index) => ({
      cursor: toOpaqueCursor(entitiesValues[index].id),
      node: ok(entity),
    })),
  });
}

export async function getTotalCount(
  context: SessionContext,
  filter?: AdminFilter
): PromiseResult<number, ErrorType.BadRequest> {
  const query = totalAdminEntitiesQuery(context, filter);
  if (query.isError()) {
    return query;
  }
  const { count } = await Db.queryOne<{ count: number }>(context, query.value);
  return ok(count);
}

export async function createEntity(
  context: SessionContext,
  entity: AdminEntityCreate,
  options: { publish: boolean }
): PromiseResult<AdminEntity, ErrorType.BadRequest> {
  const encodeResult = await encodeEntity(context, entity);
  if (encodeResult.isError()) {
    return encodeResult;
  }
  const { type, name, data, referenceIds } = encodeResult.value;

  return await context.withTransaction(async (context) => {
    const { id: entityId, uuid } = await Db.queryOne<Pick<EntitiesTable, 'id' | 'uuid'>>(
      context,
      'INSERT INTO entities (name, type) VALUES ($1, $2) RETURNING id, uuid',
      [name, type]
    );

    const { id: versionsId } = await Db.queryOne<{ id: number }>(
      context,
      'INSERT INTO entity_versions (entities_id, version, created_by, data) VALUES ($1, 0, $2, $3) RETURNING id',
      [entityId, context.session.subjectInternalId, data]
    );
    await Db.queryNone(
      context,
      `UPDATE entities SET latest_draft_entity_versions_id = $1 ${
        options.publish ? ', published_entity_versions_id = $1' : ''
      } WHERE id = $2`,
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
    return ok({ id: uuid, _version: 0, ...entity });
  });
}

export async function updateEntity(
  context: SessionContext,
  entity: AdminEntityUpdate,
  options: { publish: boolean }
): PromiseResult<AdminEntity, ErrorType.BadRequest | ErrorType.NotFound> {
  return await context.withTransaction(async (context) => {
    const versionResult = await resolveMaxVersionForEntity(context, entity.id);
    if (versionResult.isError()) {
      return versionResult;
    }
    const { entityId, maxVersion } = versionResult.value;
    const newVersion = maxVersion + 1;

    const { type, name: previousName } = await Db.queryOne<Pick<EntitiesTable, 'type' | 'name'>>(
      context,
      'SELECT type, name FROM entities e WHERE e.id = $1',
      [entityId]
    );

    const { data: previousDataEncoded } = await Db.queryOne<Pick<EntityVersionsTable, 'data'>>(
      context,
      'SELECT data FROM entity_versions WHERE entities_id = $1 AND version = $2',
      [entityId, maxVersion]
    );

    const resolvedResult = resolveEntity(
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
    const { data, name, referenceIds } = encodeResult.value;

    const { id: versionsId } = await Db.queryOne<Pick<EntityVersionsTable, 'id'>>(
      context,
      'INSERT INTO entity_versions (entities_id, created_by, version, data) VALUES ($1, $2, $3, $4) RETURNING id',
      [entityId, context.session.subjectInternalId, newVersion, data]
    );
    await Db.queryNone(
      context,
      `UPDATE entities SET name = $1, latest_draft_entity_versions_id = $2 ${
        options.publish ? ', published_entity_versions_id = $2' : ''
      }  WHERE id = $3`,
      [name, versionsId, entityId]
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

    return ok(updatedEntity);
  });
}

export async function deleteEntity(
  context: SessionContext,
  id: string,
  options: { publish: boolean }
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
      `UPDATE entities SET latest_draft_entity_versions_id = $1 ${
        options.publish ? ', published_entity_versions_id = $1, published_deleted = true' : ''
      }  WHERE id = $2`,
      [versionsId, entityId]
    );
    return ok({ id, _type: type, _name: name, _version: version });
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
): PromiseResult<EntityHistory, ErrorType.NotFound> {
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

  const result: EntityHistory = {
    id: entityMain.uuid,
    type: entityMain.type,
    name: entityMain.name,
    versions: versions.map((v) => ({
      version: v.version,
      isDelete: v.deleted,
      isPublished: v.id === entityMain.published_entity_versions_id,
      createdBy: v.created_by_uuid,
      createdAt: v.created_at,
    })),
  };
  return ok(result);
}
