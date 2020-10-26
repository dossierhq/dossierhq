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
  const typeSpec = TypeSpecifications.getEntityTypeSpecification(type);
  if (!typeSpec) {
    throw new Error(`Type (${type}) doesn't exist`);
  }
  const values: { name: string; data: unknown }[] = [];
  for (const [fieldName, fieldData] of Object.entries(fields)) {
    const fieldSpecification = TypeSpecifications.getEntityFieldSpecification(
      typeSpec,
      fieldName
    );
    const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpecification);
    const data = fieldAdapter.getData(fieldData);
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
