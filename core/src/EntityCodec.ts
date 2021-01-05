import { FieldType, notOk, ok, visitFieldsRecursively, visitorPathToString } from '.';
import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  Entity,
  FieldSpecification,
  EntityTypeSpecification,
  ErrorType,
  PromiseResult,
  Result,
  Schema,
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
      entity[fieldName] = decodeFieldItemOrList(schema, fieldSpec, fieldValue);
    }
  }
  return entity;
}

function decodeFieldItemOrList(schema: Schema, fieldSpec: FieldSpecification, fieldValue: unknown) {
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
      if (fieldSpec.type === FieldType.ValueType) {
        const decodedItem = decodeValueTypeField(schema, fieldSpec, encodedItem);
        decodedItems.push(decodedItem);
      } else {
        decodedItems.push(fieldAdapter.decodeData(encodedItem));
      }
    }
    return decodedItems;
  }
  if (fieldSpec.type === FieldType.ValueType) {
    return decodeValueTypeField(
      schema,
      fieldSpec,
      fieldValue as { _type: string; [key: string]: unknown }
    );
  }
  return fieldAdapter.decodeData(fieldValue);
}

function decodeValueTypeField(
  schema: Schema,
  fieldSpec: FieldSpecification,
  encodedValue: { _type: string; [key: string]: unknown }
) {
  const valueSpec = schema.getValueTypeSpecification(encodedValue._type);
  if (!valueSpec) {
    throw new Error(`Couldn't find spec for value type ${encodedValue._type}`);
  }
  const decodedValue: { _type: string; [key: string]: unknown } = { _type: encodedValue._type };
  for (const [fieldName, fieldValue] of Object.entries(encodedValue)) {
    if (fieldName === '_type') {
      continue;
    }

    const fieldSpec = schema.getValueFieldSpecification(valueSpec, fieldName);
    if (!fieldSpec) {
      throw new Error(`No field spec for ${fieldName} in value spec ${encodedValue._type}`);
    }
    decodedValue[fieldName] = decodeFieldItemOrList(schema, fieldSpec, fieldValue);
  }

  return decodedValue;
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
      entity[fieldName] = decodeFieldItemOrList(schema, fieldSpec, fieldValue);
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

  const unsupportedFieldsResult = checkForUnsupportedFields(entitySpec, entity);
  if (unsupportedFieldsResult.isError()) {
    return unsupportedFieldsResult;
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

  const unsupportedFieldsResult = checkForUnsupportedFields(entitySpec, entity);
  if (unsupportedFieldsResult.isError()) {
    return unsupportedFieldsResult;
  }

  for (const fieldSpec of entitySpec.fields) {
    if (fieldSpec.name in entity) {
      result[fieldSpec.name] = entity[fieldSpec.name];
    } else if (previousValuesEncoded && fieldSpec.name in previousValuesEncoded) {
      const encodedData = previousValuesEncoded[fieldSpec.name];
      result[fieldSpec.name] = decodeFieldItemOrList(schema, fieldSpec, encodedData);
    }
  }

  return ok(result);
}

function checkForUnsupportedFields(
  entitySpec: EntityTypeSpecification,
  entity: AdminEntityCreate | AdminEntityUpdate
): Result<void, ErrorType.BadRequest> {
  const unsupportedFieldNames = new Set(Object.keys(entity));

  ['id', '_name', '_type', '_version'].forEach((x) => unsupportedFieldNames.delete(x));
  entitySpec.fields.forEach((x) => unsupportedFieldNames.delete(x.name));

  if (unsupportedFieldNames.size > 0) {
    return notOk.BadRequest(`Unsupported field names: ${[...unsupportedFieldNames].join(', ')}`);
  }
  return ok(undefined);
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
      const encodeResult = encodeFieldItemOrList(schema, fieldSpec, prefix, data);
      if (encodeResult.isError()) {
        return encodeResult;
      }
      result.data[fieldSpec.name] = encodeResult.value;
    }
  }

  const referenceIdsResult = await collectReferenceIds(context, entity);
  if (referenceIdsResult.isError()) {
    return referenceIdsResult;
  }
  result.referenceIds.push(...referenceIdsResult.value);

  return ok(result);
}

function encodeFieldItemOrList(
  schema: Schema,
  fieldSpec: FieldSpecification,
  prefix: string,
  data: unknown
): Result<unknown, ErrorType.BadRequest> {
  const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
  if (fieldSpec.list) {
    if (!Array.isArray(data)) {
      return notOk.BadRequest(`${prefix}: expected list`);
    }
    const encodedItems: unknown[] = [];
    for (const decodedItem of data) {
      let encodedItemResult;
      if (fieldSpec.type === FieldType.ValueType) {
        encodedItemResult = encodeValueTypeField(schema, fieldSpec, prefix, decodedItem);
      } else {
        encodedItemResult = fieldAdapter.encodeData(prefix, decodedItem);
      }
      if (encodedItemResult.isError()) {
        return encodedItemResult;
      }
      encodedItems.push(encodedItemResult.value);
    }
    return ok(encodedItems);
  }

  if (fieldSpec.type === FieldType.ValueType) {
    return encodeValueTypeField(schema, fieldSpec, prefix, data);
  }
  return fieldAdapter.encodeData(prefix, data);
}

function encodeValueTypeField(
  schema: Schema,
  fieldSpec: FieldSpecification,
  prefix: string,
  data: unknown
): Result<unknown, ErrorType.BadRequest> {
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

  const unsupportedFields = new Set(Object.keys(value));
  unsupportedFields.delete('_type');
  valueSpec.fields.forEach((x) => unsupportedFields.delete(x.name));
  if (unsupportedFields.size > 0) {
    return notOk.BadRequest(
      `${prefix}: Unsupported field names: ${[...unsupportedFields].join(', ')}`
    );
  }

  const encodedValue: { _type: string; [key: string]: unknown } = { _type: valueType };

  for (const fieldSpec of valueSpec.fields) {
    const fieldValue = value[fieldSpec.name];
    if (fieldValue === null || fieldValue === undefined) {
      continue;
    }
    const encodedField = encodeFieldItemOrList(
      schema,
      fieldSpec,
      `${prefix}.${fieldSpec.name}`,
      fieldValue
    );
    if (encodedField.isError()) {
      return encodedField;
    }
    encodedValue[fieldSpec.name] = encodedField.value;
  }

  return ok(encodedValue);
}

async function collectReferenceIds(
  context: SessionContext,
  entity: { _type: string; [fieldName: string]: unknown }
): PromiseResult<number[], ErrorType.BadRequest> {
  const allUUIDs = new Set<string>();
  const requestedReferences: {
    prefix: string;
    uuids: string[];
    entityTypes: string[] | undefined;
  }[] = [];

  visitFieldsRecursively({
    schema: context.instance.getSchema(),
    entity,
    visitField: (path, fieldSpec, data, unusedVisitContext) => {
      if (fieldSpec.type !== FieldType.ValueType) {
        const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
        const uuids = fieldAdapter.getReferenceUUIDs(data);
        if (uuids && uuids.length > 0) {
          uuids.forEach((x) => allUUIDs.add(x));
          requestedReferences.push({
            prefix: visitorPathToString(path),
            uuids,
            entityTypes: fieldSpec.entityTypes,
          });
        }
      }
    },
    initialVisitContext: undefined,
  });

  if (allUUIDs.size === 0) {
    return ok([]);
  }

  const items = await Db.queryMany<Pick<EntitiesTable, 'id' | 'type' | 'uuid'>>(
    context,
    'SELECT id, uuid, type FROM entities WHERE uuid = ANY($1)',
    [[...allUUIDs]]
  );

  for (const request of requestedReferences) {
    for (const uuid of request.uuids) {
      const item = items.find((x) => x.uuid === uuid);
      if (!item) {
        return notOk.BadRequest(`${request.prefix}: referenced entity (${uuid}) doesn’t exist`);
      }
      if (request.entityTypes && request.entityTypes.length > 0) {
        if (request.entityTypes.indexOf(item.type) < 0) {
          return notOk.BadRequest(
            `${request.prefix}: referenced entity (${uuid}) has an invalid type ${item.type}`
          );
        }
      }
    }
  }

  return ok(items.map((item) => item.id));
}
