import { EntityFieldType, notOk, ok, Schema } from '.';
import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  Entity,
  EntityFieldSpecification,
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
      entity[fieldName] = decodeFieldItemOrList(fieldSpec, fieldValue);
    }
  }
  return entity;
}

function decodeFieldItemOrList(fieldSpec: EntityFieldSpecification, fieldValue: unknown) {
  if (fieldValue === null || fieldValue === undefined) {
    return null;
  }
  const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
  if (fieldSpec.list) {
    if (!Array.isArray(fieldValue)) {
      throw new Error(`Expected list but got ${fieldValue} (${fieldSpec.name})`);
    }
    const decodedItems: unknown[] = [];
    for (const encodedItem of fieldValue) {
      if (fieldSpec.type === EntityFieldType.ValueType) {
        decodedItems.push(encodedItem); // TODO decode value types
      } else {
        decodedItems.push(fieldAdapter.decodeData(encodedItem));
      }
    }
    return decodedItems;
  }
  if (fieldSpec.type === EntityFieldType.ValueType) {
    return fieldValue; // TODO decode value types
  }
  return fieldAdapter.decodeData(fieldValue);
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
      entity[fieldName] = decodeFieldItemOrList(fieldSpec, fieldValue);
    }
  }
  return entity;
}

export function resolveCreateEntity(
  context: SessionContext,
  entity: AdminEntityCreate
): Result<AdminEntityCreate, ErrorType.BadRequest> {
  if (!entity._type) {
    return notOk.BadRequest('Missing entity._type');
  }

  const result: AdminEntityCreate = {
    _name: entity._name,
    _type: entity._type,
    _version: 0,
  };

  const schema = context.instance.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(result._type);
  if (!entitySpec) {
    return notOk.BadRequest(`Entity type ${result._type} doesn’t exist`);
  }

  for (const fieldSpec of entitySpec.fields) {
    if (fieldSpec.name in entity) {
      result[fieldSpec.name] = entity[fieldSpec.name];
    }
  }

  return ok(result);
}

export function resolveUpdateEntity(
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
    return notOk.BadRequest(`Entity type ${result._type} doesn’t exist`);
  }

  for (const fieldSpec of entitySpec.fields) {
    if (fieldSpec.name in entity) {
      result[fieldSpec.name] = entity[fieldSpec.name];
    } else if (previousValuesEncoded && fieldSpec.name in previousValuesEncoded) {
      const encodedData = previousValuesEncoded[fieldSpec.name];
      result[fieldSpec.name] = decodeFieldItemOrList(fieldSpec, encodedData);
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
    if (fieldSpec.name in entity) {
      const data = entity[fieldSpec.name];
      if (data === null || data === undefined) {
        continue;
      }
      const prefix = `entity.${fieldSpec.name}`;
      if (fieldSpec.list) {
        if (!Array.isArray(data)) {
          return notOk.BadRequest(`${prefix}: expected list`);
        }
        const encodedItems: unknown[] = [];
        result.data[fieldSpec.name] = encodedItems;
        for (const decodedItem of data) {
          const encodeResult = encodeFieldData(schema, fieldSpec, prefix, decodedItem);
          if (encodeResult.isError()) {
            return encodeResult;
          }
          encodedItems.push(encodeResult.value);
        }
      } else {
        const encodeResult = encodeFieldData(schema, fieldSpec, prefix, data);
        if (encodeResult.isError()) {
          return encodeResult;
        }
        result.data[fieldSpec.name] = encodeResult.value;
      }
    }
  }

  const referenceIdsResult = await collectReferenceIds(context, entitySpec, entity);
  if (referenceIdsResult.isError()) {
    return referenceIdsResult;
  }
  result.referenceIds.push(...referenceIdsResult.value);

  return ok(result);
}

function encodeFieldData(
  schema: Schema,
  fieldSpec: EntityFieldSpecification,
  prefix: string,
  data: unknown
): Result<unknown, ErrorType.BadRequest> {
  if (fieldSpec.type !== EntityFieldType.ValueType) {
    const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
    return fieldAdapter.encodeData(prefix, data);
  }

  if (Array.isArray(data)) {
    return notOk.BadRequest(`${prefix}: expected single value, got list`);
  }
  if (typeof data !== 'object' || !data) {
    return notOk.BadRequest(`${prefix}: expected object, got ${typeof data}`);
  }
  const value = data as { _type: string; [key: string]: unknown };
  const valueType = value._type;
  if (!valueType) {
    return notOk.BadRequest(`${prefix}: missing _type`);
  }
  const valueSpec = schema.getValueTypeSpecification(valueType);
  if (!valueSpec) {
    return notOk.BadRequest(`${prefix}: value type ${valueType} doesn’t exist`);
  }
  if (
    fieldSpec.valueTypes &&
    fieldSpec.valueTypes.length > 0 &&
    fieldSpec.valueTypes.indexOf(valueType) < 0
  ) {
    return notOk.BadRequest(`${prefix}: value of type ${valueType} is not allowed`);
  }

  return ok(data);
}

async function collectReferenceIds(
  context: SessionContext,
  entitySpec: EntityTypeSpecification,
  entity: AdminEntityCreate | AdminEntityUpdate
): PromiseResult<number[], ErrorType.BadRequest> {
  const uuids = new Set<string>();

  for (const fieldSpec of entitySpec.fields) {
    const fieldReferences = getReferencesForField(entity, fieldSpec);
    if (fieldReferences.isError()) {
      return fieldReferences;
    }
    fieldReferences.value?.forEach((x) => uuids.add(x));
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
    const fieldReferences = getReferencesForField(entity, fieldSpec);
    if (fieldReferences.isError()) {
      return fieldReferences;
    }
    const fieldUUIDs = fieldReferences.value;

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

function getReferencesForField(
  entity: AdminEntityCreate | AdminEntityUpdate,
  fieldSpec: EntityFieldSpecification
): Result<string[] | null, ErrorType.BadRequest> {
  if (fieldSpec.type === EntityFieldType.ValueType) {
    return ok(null); //TODO support references in value types
  }
  const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
  let fieldUUIDs: string[] | null = null;
  if (fieldSpec.name in entity) {
    const data = entity[fieldSpec.name];
    const prefix = `entity.${fieldSpec.name}`;
    if (fieldSpec.list) {
      fieldUUIDs = [];
      if (!Array.isArray(data)) {
        return notOk.BadRequest(`${prefix}: Expected list`);
      }
      for (const decodedItem of data) {
        const uuids = fieldAdapter.getReferenceUUIDs(decodedItem);
        if (uuids) {
          fieldUUIDs.push(...uuids);
        }
      }
    } else {
      fieldUUIDs = fieldAdapter.getReferenceUUIDs(data);
    }
  }
  return ok(fieldUUIDs);
}
