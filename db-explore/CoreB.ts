import { Entity, Query, Session, encodeFieldsToValues } from './Core';
import * as Db from './Db';
import * as EntityFieldTypeAdapters from './EntityFieldTypeAdapters';
import * as TypeSpecifications from './TypeSpecifications';
import { EntityFieldType } from './TypeSpecifications';

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
               SELECT $1, id FROM entities WHERE uuid = $2`,
            [versionsId, uuid]
          );
        }
      }
    }
    return { uuid };
  });
}

export async function getRandomEntity(
  query: Query
): Promise<{
  item: Entity;
  referenced: Entity[];
} | null> {
  return null;
}
