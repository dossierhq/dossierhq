import {
  Entity,
  Query,
  Session,
  createSessionForPrincipal,
  decodeValuesToFields,
  encodeFieldsToValues,
} from './Core';
import * as Db from './Db';
import * as EntityFieldTypeAdapters from './EntityFieldTypeAdapters';
import * as TypeSpecifications from './TypeSpecifications';
import { EntityFieldType } from './TypeSpecifications';

export { Query, Session, Entity, createSessionForPrincipal };

export async function createEntity(
  session: Session,
  type: string,
  name: string,
  fields: Record<string, unknown>
): Promise<{ uuid: string }> {
  const values = encodeFieldsToValues(type, fields);

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
      [
        entityId,
        session.subjectId,
        Object.fromEntries(values.map((x) => [x.name, x.data])),
      ]
    );
    await Db.queryNone(
      client,
      `UPDATE entitiesb SET published_entityb_versions = $1 WHERE id = $2`,
      [versionsId, entityId]
    );
    for (const { referenceUUIDs } of values) {
      if (referenceUUIDs && referenceUUIDs.length > 0) {
        for (const uuid of referenceUUIDs) {
          //TODO ensure uuid existed
          await Db.queryNone(
            client,
            `INSERT INTO entityb_version_references (entityb_versions_id, entities_id)
               SELECT $1, id FROM entitiesb WHERE uuid = $2`,
            [versionsId, uuid]
          );
        }
      }
    }
    return { uuid };
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
    `SELECT id, uuid, type, name FROM entities WHERE uuid = $1 AND published_deleted = false`,
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

  const fields = decodeValuesToFields(
    entity.type,
    Object.entries(data).map(([name, data]) => ({ name, data }))
  );

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
    name: string;
    data: unknown;
  }[] = await Db.queryMany(
    Db.pool,
    `SELECT entities_id, name, data FROM published_entity_fields WHERE entities_id = ANY($1)`,
    [entities.map((x) => x.id)]
  );

  const result: Entity[] = [];
  for (const entity of entities) {
    const fields = decodeValuesToFields(
      entity.type,
      values.filter((x) => x.entities_id === entity.id)
    );
    result.push({
      uuid: entity.uuid,
      name: entity.name,
      type: entity.type,
      fields: fields,
    });
  }
  return result;
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
