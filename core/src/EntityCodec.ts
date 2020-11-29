import { notOk, ok } from '.';
import type {
  AdminEntity,
  AdminEntityUpdate,
  Entity,
  EntityTypeSpecification,
  ErrorType,
  PromiseResult,
  Result,
  SessionContext,
} from '.';
import { ensureRequired } from './Assertions';
import * as Db from './Db';
import type { EntitiesTable, EntityVersionsTable } from './DbTableTypes';
import * as EntityFieldTypeAdapters from './EntityFieldTypeAdapters';

export type AdminEntityValues = Pick<EntitiesTable, 'uuid' | 'type' | 'name'> &
  Pick<EntityVersionsTable, 'data' | 'version'>;

export type EntityValues = Pick<EntitiesTable, 'uuid' | 'type' | 'name'> &
  Pick<EntityVersionsTable, 'data'>;

interface EncodeEntityResult {
  type: string;
  name: string;
  data: Record<string, unknown>;
  referenceIds: number[];
}

export function decodePublishedEntity(context: SessionContext, values: EntityValues): Entity {
  const schema = context.instance.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(values.type);
  if (!entitySpec) {
    throw new Error(`No entity spec for type ${values.type}`);
  }
  const entity: Entity = {
    id: values.uuid,
    _type: values.type,
    _name: values.name,
  };
  if (values.data) {
    for (const [fieldName, fieldValue] of Object.entries(values.data)) {
      const fieldSpec = schema.getEntityFieldSpecification(entitySpec, fieldName);
      if (!fieldSpec) {
        throw new Error(`No field spec for ${fieldName} in entity spec ${values.type}`);
      }
      const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
      const decodedData = fieldAdapter.decodeData(fieldValue);
      entity[fieldName] = decodedData;
    }
  }
  return entity;
}

export function decodeAdminEntity(context: SessionContext, values: AdminEntityValues): AdminEntity {
  const schema = context.instance.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(values.type);
  if (!entitySpec) {
    throw new Error(`No entity spec for type ${values.type}`);
  }
  const entity: AdminEntity = {
    id: values.uuid,
    _type: values.type,
    _name: values.name,
    _version: values.version,
  };
  if (!values.data) {
    entity._deleted = true;
  } else {
    for (const [fieldName, fieldValue] of Object.entries(values.data)) {
      const fieldSpec = schema.getEntityFieldSpecification(entitySpec, fieldName);
      if (!fieldSpec) {
        throw new Error(`No field spec for ${fieldName} in entity spec ${values.type}`);
      }
      const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
      const decodedData = fieldAdapter.decodeData(fieldValue);
      entity[fieldName] = decodedData;
    }
  }
  return entity;
}

export function resolveEntity(
  context: SessionContext,
  entity: AdminEntityUpdate,
  type: string,
  previousName: string,
  version: number,
  previousValuesEncoded: Record<string, unknown> | null
): Result<AdminEntity, ErrorType.BadRequest> {
  if (entity._type && entity._type !== type) {
    return notOk.BadRequest(`New type ${entity._type} doesn’t correspond to previous type ${type}`);
  }
  const result: AdminEntity = {
    id: entity.id,
    _name: entity._name || previousName,
    _type: type,
    _version: version,
  };

  const schema = context.instance.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(result._type);
  if (!entitySpec) {
    return notOk.BadRequest(`Entity type ${type} doesn’t exist`);
  }

  for (const fieldSpec of entitySpec.fields) {
    if (fieldSpec.name in entity) {
      result[fieldSpec.name] = entity[fieldSpec.name];
    } else if (previousValuesEncoded && fieldSpec.name in previousValuesEncoded) {
      const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
      const encodedData = previousValuesEncoded[fieldSpec.name];
      result[fieldSpec.name] = fieldAdapter.decodeData(encodedData);
    }
  }

  return ok(result);
}

export async function encodeEntity(
  context: SessionContext,
  entity: { _type: string; _name: string; [fieldName: string]: unknown }
): PromiseResult<EncodeEntityResult, ErrorType.BadRequest> {
  const assertion = ensureRequired({ 'entity._type': entity._type, 'entity._name': entity._name });
  if (assertion.isError()) {
    return assertion;
  }

  const { _type: type, _name: name } = entity;

  const schema = context.instance.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(type);
  if (!entitySpec) {
    return notOk.BadRequest(`Entity type ${type} doesn’t exist`);
  }

  const result: EncodeEntityResult = {
    type,
    name,
    data: {},
    referenceIds: [],
  };
  for (const fieldSpec of entitySpec.fields) {
    const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
    if (fieldSpec.name in entity) {
      const data = entity[fieldSpec.name];
      result.data[fieldSpec.name] = fieldAdapter.encodeData(data);
    }
  }

  const referenceIdsResult = await collectReferenceIds(context, entitySpec, entity);
  if (referenceIdsResult.isError()) {
    return referenceIdsResult;
  }
  result.referenceIds.push(...referenceIdsResult.value);

  return ok(result);
}

async function collectReferenceIds(
  context: SessionContext,
  entitySpec: EntityTypeSpecification,
  entity: { _type: string; _name: string; [fieldName: string]: unknown }
): PromiseResult<number[], ErrorType.BadRequest> {
  const uuids = new Set<string>();

  for (const fieldSpec of entitySpec.fields) {
    const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
    let fieldUUIDs: string[] | null = null;
    if (fieldSpec.name in entity) {
      const data = entity[fieldSpec.name];
      fieldUUIDs = fieldAdapter.getReferenceUUIDs(data);
    }
    fieldUUIDs?.forEach((x) => uuids.add(x));
  }

  if (uuids.size === 0) {
    return ok([]);
  }

  const items = await Db.queryMany<Pick<EntitiesTable, 'id' | 'type' | 'uuid'>>(
    context,
    'SELECT id, uuid, type FROM entities WHERE uuid = ANY($1)',
    [[...uuids]]
  );

  for (const fieldSpec of entitySpec.fields) {
    const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
    let fieldUUIDs: string[] | null = null;
    if (fieldSpec.name in entity) {
      const data = entity[fieldSpec.name];
      fieldUUIDs = fieldAdapter.getReferenceUUIDs(data);
    }

    if (!fieldUUIDs || fieldUUIDs.length === 0) {
      continue;
    }
    for (const uuid of fieldUUIDs) {
      const item = items.find((x) => x.uuid === uuid);
      if (!item) {
        return notOk.BadRequest(
          `Referenced entity (${uuid}) of field ${fieldSpec.name} doesn’t exist`
        );
      }
      if (fieldSpec.entityTypes && fieldSpec.entityTypes.length > 0) {
        if (fieldSpec.entityTypes.indexOf(item.type) < 0) {
          return notOk.BadRequest(
            `Referenced entity (${uuid}) of field ${fieldSpec.name} has an invalid type ${item.type}`
          );
        }
      }
    }
  }

  return ok(items.map((item) => item.id));
}
