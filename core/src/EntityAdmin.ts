import type { ErrorType, PromiseResult, SessionContext } from '.';
import * as Db from './Db';
import type { EntitiesTable, EntityVersionsTable } from './DbTableTypes';
import { decodeEntity, encodeEntity } from './EntityCodec';
import type { EntityValues } from './EntityCodec';
import { notOk, ok } from './ErrorResult';

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
  [fieldName: string]: unknown;
}

export interface AdminEntityCreate {
  /** UUIDv4 */
  id?: string;
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
  const entityMain = await Db.queryNoneOrOne<EntityValues>(
    context,
    `SELECT e.uuid, e.type, e.name, ev.data
      FROM entities e, entity_versions ev
      WHERE e.uuid = $1
      AND e.id = ev.entities_id
      AND ev.version = $2`,
    [id, version]
  );
  if (!entityMain) {
    return notOk.NotFound('No such entity or version');
  }

  const entity = decodeEntity(context, entityMain);

  return ok({
    item: entity,
  });
}

export async function searchEntities(
  context: SessionContext
): PromiseResult<{ items: AdminEntity[] }, ErrorType> {
  const entitiesValues = await Db.queryMany<EntityValues>(
    context,
    `SELECT e.uuid, e.type, e.name, ev.data
      FROM entities e, entity_versions ev
      WHERE e.latest_draft_entity_versions_id = ev.id`
  );
  const entities = entitiesValues.map((x) => decodeEntity(context, x));
  return ok({ items: entities });
}

export async function createEntity(
  context: SessionContext,
  entity: AdminEntityCreate,
  options: { publish: boolean }
): PromiseResult<{ id: string }, ErrorType.BadRequest> {
  const encodeResult = encodeEntity(context, entity, null);
  if (encodeResult.isError()) {
    return encodeResult;
  }
  const { type, name, data } = encodeResult.value;

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
    return ok({ id: uuid });
  });
}

export async function updateEntity(
  context: SessionContext,
  entity: AdminEntityUpdate,
  options: { publish: boolean }
): PromiseResult<void, ErrorType.BadRequest | ErrorType.NotFound> {
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

    if (entity._type && entity._type !== type) {
      return notOk.BadRequest(
        `New type ${entity._type} doesn’t correspond to previous type ${type}`
      );
    }

    const { data: previousDataEncoded } = await Db.queryOne<Pick<EntityVersionsTable, 'data'>>(
      context,
      'SELECT data FROM entity_versions WHERE entities_id = $1 AND version = $2',
      [entityId, maxVersion]
    );

    const encodeResult = encodeEntity(
      context,
      {
        _name: previousName, // default to previous but allow changing
        ...entity,
        _type: type, // always same as previously stored
      },
      previousDataEncoded
    );
    if (encodeResult.isError()) {
      return encodeResult;
    }
    const { data, name } = encodeResult.value;

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
    return ok(undefined);
  });
}

export async function deleteEntity(
  context: SessionContext,
  id: string,
  options: { publish: boolean }
): PromiseResult<void, ErrorType.NotFound> {
  return await context.withTransaction(async (context) => {
    const versionResult = await resolveMaxVersionForEntity(context, id);
    if (versionResult.isError()) {
      return versionResult;
    }
    const { entityId, maxVersion } = versionResult.value;
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
