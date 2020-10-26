import * as Db from './Db';
import * as EntityFieldTypeAdapters from './EntityFieldTypeAdapters';
import * as TypeSpecifications from './TypeSpecifications';

export interface Session {
  subjectId: number;
}

export interface Entity {
  uuid: string;
  name: string;
  type: string;
  fields: Record<string, unknown>;
}

export async function createSessionForPrincipal(
  provider: string,
  identifier: string
): Promise<Session> {
  const { id } = await Db.queryOne(
    Db.pool,
    `SELECT s.id FROM subjects s, principals p WHERE p.provider = $1 AND p.identifier = $2 AND p.subjects_id = s.id`,
    [provider, identifier]
  );
  return { subjectId: id };
}

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

export async function selectAllPrincipals(): Promise<
  { uuid: string; provider: string; identifier: string }[]
> {
  return await Db.queryMany(
    Db.pool,
    `SELECT s.uuid, p.provider, p.identifier FROM subjects s, principals p WHERE s.id = p.subjects_id`
  );
}

function encodeFieldsToValues(type: string, fields: Record<string, unknown>) {
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
  return values;
}

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
      `INSERT INTO entities (name, type) VALUES ($1, $2)  RETURNING id, uuid`,
      [name, type]
    );
    await client.query(
      `INSERT INTO entity_versions (entities_id, created_by) VALUES ($1, $2)`,
      [entityId, session.subjectId]
    );
    for (const { name, data } of values) {
      //TODO change to one query
      await client.query(
        `INSERT INTO entity_fields (entities_id, name, data) VALUES ($1, $2, $3)`,
        [entityId, name, data]
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
      version: previousVersion,
    } = await Db.queryOne(
      client,
      `SELECT ev.entities_id, MAX(ev.version) AS version FROM entity_versions ev, entities e WHERE e.uuid = $1 AND e.id = ev.entities_id GROUP BY entities_id`,
      [uuid]
    );
    const newVersion = previousVersion + 1;

    const { type } = await Db.queryOne(
      client,
      `UPDATE entities SET name = $1, published_version = $2 WHERE id = $3 RETURNING type`,
      [name, newVersion, entityId]
    );

    const values = encodeFieldsToValues(type, fields);

    await Db.queryNone(
      client,
      `INSERT INTO entity_versions (entities_id, created_by, version) VALUES ($1, $2, $3)`,
      [entityId, session.subjectId, newVersion]
    );

    for (const { name, data } of values) {
      //TODO change to one query
      await Db.queryNone(
        client,
        `INSERT INTO entity_fields (entities_id, name, data, min_version, max_version) VALUES ($1, $2, $3, $4, $4)`,
        [entityId, name, data, newVersion]
      );
    }
    // Update max_version of active fields that aren't updated
    await Db.queryNone(
      client,
      `UPDATE entity_fields SET max_version = $1 WHERE entities_id = $2 AND name != ANY($3) AND $4 >= min_version AND $4 <= max_version`,
      [newVersion, entityId, Object.keys(fields), previousVersion]
    );
  });
}

export async function deleteEntity(session: Session, uuid: string) {
  await Db.withTransaction(async (client) => {
    const {
      entities_id: entityId,
      version: maxVersion,
    } = await Db.queryOne(
      client,
      `SELECT ev.entities_id, MAX(ev.version) AS version FROM entity_versions ev, entities e WHERE e.uuid = $1 AND e.id = ev.entities_id GROUP BY entities_id`,
      [uuid]
    );
    const version = maxVersion + 1;
    await Db.queryNone(
      client,
      `INSERT INTO entity_versions (entities_id, created_by, version) VALUES ($1, $2, $3)`,
      [entityId, session.subjectId, version]
    );
    await Db.queryNone(
      client,
      `UPDATE entities SET published_version = $1, published_deleted = true WHERE id = $2`,
      [version, entityId]
    );
  });
}

export async function getEntity(uuid: string): Promise<Entity> {
  const entity = await Db.queryOne(
    Db.pool,
    `SELECT id, uuid, type, name FROM entities WHERE uuid = $1 AND published_deleted = false`,
    [uuid]
  );

  const values: {
    entities_id: number;
    name: string;
    data: unknown;
  }[] = await Db.queryMany(
    Db.pool,
    `SELECT name, data FROM published_entity_fields WHERE entities_id = $1`,
    [entity.id]
  );

  const entitySpec = TypeSpecifications.getEntityTypeSpecification(entity.type);
  const fields: Record<string, unknown> = {};
  for (const value of values) {
    const fieldSpec = TypeSpecifications.getEntityFieldSpecification(
      entitySpec,
      value.name
    );
    const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
    fields[value.name] = fieldAdapter.decodeData(value.data);
  }
  return {
    uuid: entity.uuid,
    name: entity.name,
    type: entity.type,
    fields: fields,
  };
}

export async function getAllEntities(): Promise<Entity[]> {
  const entities: {
    id: number;
    uuid: string;
    type: string;
    name: string;
  }[] = await Db.queryMany(
    Db.pool,
    `SELECT id, uuid, type, name FROM entities WHERE published_deleted = false`
  );
  const values: {
    entities_id: number;
    name: string;
    data: unknown;
  }[] = await Db.queryMany(
    Db.pool,
    `SELECT entities_id, name, data FROM published_entity_fields WHERE entities_id = ANY($1)`,
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
    result.push({
      uuid: entity.uuid,
      name: entity.name,
      type: entity.type,
      fields: fields,
    });
  }
  return result;
}
