import * as Db from './Db';
import * as EntityFieldTypeAdapters from './EntityFieldTypeAdapters';
import * as TypeSpecifications from './TypeSpecifications';

export async function createPrincipal(provider: string, identifier: string) {
  await Db.withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO subjects DEFAULT VALUES RETURNING id`
    );
    const subjectId = rows[0].id;
    await client.query(
      `INSERT INTO principals (provider, identifier, subjects_id) VALUES ($1, $2, $3)`,
      [provider, identifier, subjectId]
    );
  });
}

export async function selectAllPrincipals() {
  return await Db.queryMany(
    Db.pool,
    `SELECT s.uuid, p.provider, p.identifier FROM subjects s, principals p WHERE s.id = p.subjects_id`
  );
}

export async function insertEntity(
  type: string,
  name: string,
  fields: Record<string, unknown>
) {
  const entitySpec = TypeSpecifications.getEntityTypeSpecification(type);
  const values: { name: string; data: unknown }[] = [];
  for (const [fieldName, fieldData] of Object.entries(fields)) {
    const fieldSpec = TypeSpecifications.getEntityFieldSpecification(
      entitySpec,
      fieldName
    );
    const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
    const data = fieldAdapter.encodeData(fieldData);
    values.push({ name: fieldName, data });
  }

  await Db.withTransaction(async (client) => {
    const {
      rows,
    } = await client.query(
      `INSERT INTO entities (name, type) VALUES ($1, $2)  RETURNING id`,
      [name, type]
    );
    const entityId = rows[0].id;
    for (const { name, data } of values) {
      //TODO change to one query
      await client.query(
        `INSERT INTO entity_fields (entities_id, name, data) VALUES ($1, $2, $3)`,
        [entityId, name, data]
      );
    }
  });
}

export async function getAllEntities() {
  const entities: {
    id: number;
    uuid: string;
    type: string;
    name: string;
  }[] = await Db.queryMany(
    Db.pool,
    `SELECT id, uuid, type, name FROM entities`
  );
  const values: {
    entities_id: number;
    name: string;
    data: unknown;
  }[] = await Db.queryMany(
    Db.pool,
    `SELECT entities_id, name, data FROM entity_fields WHERE entities_id = ANY($1)`,
    [entities.map((x) => x.id)]
  );

  const result = [];
  for (const entity of entities) {
    const entitySpec = TypeSpecifications.getEntityTypeSpecification(
      entity.type
    );
    const fields: Record<string, unknown> = {};
    for (const value of values) {
      if (value.entities_id !== entity.id) {
        continue;
      }
      const fieldSpec = TypeSpecifications.getEntityFieldSpecification(
        entitySpec,
        value.name
      );
      const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
      fields[value.name] = fieldAdapter.decodeData(value.data);
    }
    result.push({ uuid: entity.uuid, name: entity.name, fields: fields });
  }
  return result;
}
