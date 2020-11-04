import * as Core from './Core';
import * as Db from './Db';
import * as EntityFieldTypeAdapters from './EntityFieldTypeAdaptersB';
import * as TypeSpecifications from './TypeSpecifications';

export type Entity = Core.Entity;
export type Query = Core.Query;
export type Session = Core.Session;

export const createSessionForPrincipal = Core.createSessionForPrincipal;
export const selectAllPrincipals = Core.selectAllPrincipals;
export const createPrincipal = Core.createPrincipal;
export const resolveEntity = Core.resolveEntity;

export function encodeFieldsToValues(
  type: string,
  fields: Record<string, unknown>,
  previousData: Record<string, unknown>
) {
  const entitySpec = TypeSpecifications.getEntityTypeSpecification(type);
  const result: { data: Record<string, unknown>; referenceUUIDs: string[] } = {
    data: {},
    referenceUUIDs: [],
  };
  for (const fieldSpec of entitySpec.fields) {
    const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
    const data = fields[fieldSpec.name] || previousData[fieldSpec.name];
    result.data[fieldSpec.name] = fieldAdapter.encodeData(data);
    const referenceUUIDs = fieldAdapter.getReferenceUUIDs(data);
    if (referenceUUIDs) {
      result.referenceUUIDs.push(...referenceUUIDs);
    }
  }
  return result;
}

export function decodeValuesToFields(
  type: string,
  data: Record<string, unknown>
) {
  const entitySpec = TypeSpecifications.getEntityTypeSpecification(type);
  const result: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(data)) {
    const fieldSpec = TypeSpecifications.getEntityFieldSpecification(
      entitySpec,
      name
    );
    const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
    const decodedData = fieldAdapter.decodeData(value);
    result[name] = decodedData;
  }
  return result;
}

export async function createEntity(
  session: Session,
  type: string,
  name: string,
  fields: Record<string, unknown>
): Promise<{ uuid: string }> {
  const { data, referenceUUIDs } = encodeFieldsToValues(type, fields, {});

  return await Db.withTransaction(async (client) => {
    const {
      id: entityId,
      uuid,
    }: { id: number; uuid: string } = await Db.queryOne(
      client,
      `INSERT INTO entitiesb (name, type) VALUES ($1, $2) RETURNING id, uuid`,
      [name, type]
    );
    const { id: versionsId } = await Db.queryOne(
      client,
      `INSERT INTO entityb_versions (entities_id, version, created_by, data) VALUES ($1, 0, $2, $3) RETURNING id`,
      [entityId, session.subjectId, data]
    );
    await Db.queryNone(
      client,
      `UPDATE entitiesb SET published_entityb_versions = $1 WHERE id = $2`,
      [versionsId, entityId]
    );
    for (const uuid of referenceUUIDs) {
      //TODO ensure uuid existed
      await Db.queryNone(
        client,
        `INSERT INTO entityb_version_references (entityb_versions_id, entities_id)
               SELECT $1, id FROM entitiesb WHERE uuid = $2`,
        [versionsId, uuid]
      );
    }
    return { uuid };
  });
}

export async function updateEntity(
  session: Session,
  uuid: string,
  name: string,
  fields: Record<string, unknown>
) {
  await Db.withTransaction(async (client) => {
    const {
      entities_id: entityId,
      version: maxVersion,
    } = await Db.queryOne(
      client,
      `SELECT ev.entities_id, MAX(ev.version) AS version FROM entityb_versions ev, entitiesb e WHERE e.uuid = $1 AND e.id = ev.entities_id GROUP BY entities_id`,
      [uuid]
    );
    const newVersion = maxVersion + 1;

    const { type } = await Db.queryOne(
      client,
      'SELECT type FROM entitiesb e WHERE e.id = $1',
      [entityId]
    );

    const { data: previousDataRaw } = await Db.queryOne(
      client,
      'SELECT data FROM entityb_versions WHERE entities_id = $1 AND data IS NOT NULL ORDER BY version DESC LIMIT 1',
      [entityId]
    );
    const previousData = decodeValuesToFields(type, previousDataRaw);

    const { data, referenceUUIDs } = encodeFieldsToValues(
      type,
      fields,
      previousData
    );
    const { id: versionsId } = await Db.queryOne(
      client,
      `INSERT INTO entityb_versions (entities_id, created_by, version, data) VALUES ($1, $2, $3, $4) RETURNING id`,
      [entityId, session.subjectId, newVersion, data]
    );
    await Db.queryNone(
      client,
      `UPDATE entitiesb SET name = $1, published_entityb_versions = $2 WHERE id = $3`,
      [name, versionsId, entityId]
    );

    for (const uuid of referenceUUIDs) {
      //TODO ensure uuid existed
      await Db.queryNone(
        client,
        `INSERT INTO entityb_version_references (entityb_versions_id, entities_id)
               SELECT $1, id FROM entitiesb WHERE uuid = $2`,
        [versionsId, uuid]
      );
    }
  });
}

export async function deleteEntity(session: Session, uuid: string) {
  await Db.withTransaction(async (client) => {
    const {
      entities_id: entityId,
      version: maxVersion,
    } = await Db.queryOne(
      client,
      `SELECT ev.entities_id, MAX(ev.version) AS version FROM entityb_versions ev, entitiesb e WHERE e.uuid = $1 AND e.id = ev.entities_id GROUP BY entities_id`,
      [uuid]
    );
    const version = maxVersion + 1;
    const { id: versionsId } = await Db.queryOne(
      client,
      `INSERT INTO entityb_versions (entities_id, created_by, version) VALUES ($1, $2, $3) RETURNING id`,
      [entityId, session.subjectId, version]
    );
    await Db.queryNone(
      client,
      `UPDATE entitiesb SET published_entityb_versions = $1, published_deleted = true WHERE id = $2`,
      [versionsId, entityId]
    );
  });
}

export async function getEntity(
  uuid: string
): Promise<{ item: Entity; referenced: Entity[] }> {
  const entity: {
    id: number;
    uuid: string;
    type: string;
    name: string;
  } = await Db.queryOne(
    Db.pool,
    `SELECT id, uuid, type, name FROM entitiesb WHERE uuid = $1 AND published_deleted = false`,
    [uuid]
  );
  return doGetEntity(entity);
}

export async function getRandomEntity(
  query: Query
): Promise<{
  item: Entity;
  referenced: Entity[];
} | null> {
  const totalCount = await getTotalCount(query);
  if (totalCount === 0) {
    return null;
  }
  const offset = Math.floor(Math.random() * totalCount);

  let entity: {
    id: number;
    uuid: string;
    type: string;
    name: string;
  };
  if (query.entityTypes && query.entityTypes.length > 0) {
    entity = await Db.queryOne(
      Db.pool,
      `SELECT id, uuid, type, name FROM entitiesb WHERE published_deleted = false AND type = ANY($1) LIMIT 1 OFFSET $2`,
      [query.entityTypes, offset]
    );
  } else {
    entity = await Db.queryOne(
      Db.pool,
      `SELECT id, uuid, type, name FROM entitiesb WHERE published_deleted = false LIMIT 1 OFFSET $1`,
      [offset]
    );
  }
  return await doGetEntity(entity);
}

async function doGetEntity(entity: {
  id: number;
  uuid: string;
  type: string;
  name: string;
}) {
  const { id: entityVersionId, data } = await Db.queryOne(
    Db.pool,
    `SELECT ev.id, ev.data FROM entitiesb e, entityb_versions ev WHERE e.id = $1 AND e.published_entityb_versions = ev.id`,
    [entity.id]
  );

  const fields = decodeValuesToFields(entity.type, data);

  const referencedEntities: {
    id: number;
    uuid: string;
    type: string;
    name: string;
  }[] = await Db.queryMany(
    Db.pool,
    'SELECT e.id, e.uuid, e.type, e.name FROM entitiesb e, entityb_version_references evr WHERE evr.entityb_versions_id = $1 AND evr.entities_id = e.id',
    [entityVersionId]
  );
  const referenced = await doGetEntities(referencedEntities);

  return {
    item: {
      uuid: entity.uuid,
      name: entity.name,
      type: entity.type,
      fields,
    },
    referenced,
  };
}

async function doGetEntities(
  entities: { id: number; type: string; uuid: string; name: string }[]
) {
  const values: {
    entities_id: number;
    data: Record<string, unknown>;
  }[] = await Db.queryMany(
    Db.pool,
    `SELECT entities_id, data FROM entityb_versions WHERE entities_id = ANY($1)`,
    [entities.map((x) => x.id)]
  );

  const result: Entity[] = [];
  for (const entity of entities) {
    const data = values.find((x) => x.entities_id === entity.id)?.data || {};
    const fields = decodeValuesToFields(entity.type, data);
    result.push({
      uuid: entity.uuid,
      name: entity.name,
      type: entity.type,
      fields: fields,
    });
  }
  return result;
}

export async function getAllEntities(
  query: Query
): Promise<{
  items: Entity[];
  referenced: Entity[];
}> {
  let entities: {
    id: number;
    uuid: string;
    type: string;
    name: string;
  }[];
  if (query.entityTypes && query.entityTypes.length > 0) {
    entities = await Db.queryMany(
      Db.pool,
      `SELECT id, uuid, type, name FROM entitiesb WHERE published_deleted = false AND type = ANY($1)`,
      [query.entityTypes]
    );
  } else {
    entities = await Db.queryMany(
      Db.pool,
      `SELECT id, uuid, type, name FROM entitiesb WHERE published_deleted = false`
    );
  }
  const items = await doGetEntities(entities);

  const referencedEntities: {
    id: number;
    uuid: string;
    type: string;
    name: string;
  }[] = await Db.queryMany(
    Db.pool,
    `SELECT e2.id, e2.uuid, e2.type, e2.name FROM entitiesb e1, entitiesb e2, entityb_versions ev, entityb_version_references evr
    WHERE
      e1.published_deleted = false
      AND e1.id = ev.entities_id
      AND ev.id = evr.entityb_versions_id
      AND evr.entityb_versions_id = e2.id`,
    []
  );
  const referenced = await doGetEntities(referencedEntities);

  return { items, referenced };
}

async function getTotalCount(query: Query): Promise<number> {
  // Convert count to ::integer since count() is bigint (js doesn't support 64 bit numbers so pg return it as string)
  if (query.entityTypes && query.entityTypes.length > 0) {
    const { count } = await Db.queryOne(
      Db.pool,
      `SELECT COUNT(id)::integer FROM entitiesb WHERE published_deleted = false AND type = ANY($1)`,
      [query.entityTypes]
    );
    return count;
  }
  const { count } = await Db.queryOne(
    Db.pool,
    `SELECT COUNT(id)::integer FROM entitiesb WHERE published_deleted = false`
  );
  return count;
}
