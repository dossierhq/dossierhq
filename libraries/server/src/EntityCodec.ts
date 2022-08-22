import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityTypeSpecification,
  AdminEntityUpdate,
  AdminFieldSpecification,
  AdminSchema,
  EntityLike,
  ErrorType,
  Location,
  PromiseResult,
  PublishedEntity,
  PublishedEntityTypeSpecification,
  PublishedFieldSpecification,
  PublishedSchema,
  Result,
  RichText,
  ValueItem,
} from '@jonasb/datadata-core';
import {
  AdminEntityStatus,
  FieldType,
  isFieldValueEqual,
  isLocationItemField,
  isRichTextEntityNode,
  isRichTextField,
  isRichTextItemField,
  isRichTextTextNode,
  isRichTextValueItemNode,
  isStringItemField,
  isValueTypeField,
  isValueTypeItemField,
  normalizeFieldValue,
  notOk,
  ok,
  traverseAdminEntity,
  validateTraverseNode,
  visitItemRecursively,
  visitorPathToString,
} from '@jonasb/datadata-core';
import type {
  DatabaseAdapter,
  DatabaseAdminEntityPayload,
  DatabaseEntityUpdateGetEntityInfoPayload,
  DatabasePublishedEntityPayload,
  DatabaseResolvedEntityReference,
} from '@jonasb/datadata-database-adapter';
import { ensureRequired } from './Assertions.js';
import type { SessionContext } from './Context.js';
import * as EntityFieldTypeAdapters from './EntityFieldTypeAdapters.js';

export interface EncodeAdminEntityResult {
  type: string;
  name: string;
  data: Record<string, unknown>;
  referenceIds: DatabaseResolvedEntityReference[];
  locations: Location[];
  fullTextSearchText: string[];
}

interface RequestedReference {
  prefix: string;
  uuids: string[];
  entityTypes: string[] | undefined;
}

export function decodePublishedEntity(
  schema: PublishedSchema,
  values: DatabasePublishedEntityPayload
): PublishedEntity {
  const entitySpec = schema.getEntityTypeSpecification(values.type);
  if (!entitySpec) {
    throw new Error(`No entity spec for type ${values.type}`);
  }
  const entity: PublishedEntity = {
    id: values.id,
    info: {
      type: values.type,
      name: values.name,
      authKey: values.authKey,
      createdAt: values.createdAt,
    },
    fields: {},
  };
  for (const fieldSpec of entitySpec.fields) {
    const { name: fieldName } = fieldSpec;
    const fieldValue = values.fieldValues[fieldName];
    entity.fields[fieldName] = decodeFieldItemOrList(schema, fieldSpec, fieldValue);
  }
  return entity;
}

function decodeFieldItemOrList(
  schema: AdminSchema | PublishedSchema,
  fieldSpec: AdminFieldSpecification | PublishedFieldSpecification,
  fieldValue: unknown
) {
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
        const decodedItem = decodeValueItemField(schema, fieldSpec, encodedItem);
        decodedItems.push(decodedItem);
      } else if (fieldSpec.type === FieldType.RichText) {
        decodedItems.push(decodeRichTextField(encodedItem));
      } else {
        decodedItems.push(fieldAdapter.decodeData(encodedItem));
      }
    }
    return decodedItems;
  }
  if (fieldSpec.type === FieldType.ValueType) {
    return decodeValueItemField(schema, fieldSpec, fieldValue as ValueItem);
  }
  if (fieldSpec.type === FieldType.RichText) {
    return decodeRichTextField(fieldValue as RichText);
  }
  return fieldAdapter.decodeData(fieldValue);
}

function decodeValueItemField(
  schema: AdminSchema | PublishedSchema,
  _fieldSpec: AdminFieldSpecification | PublishedFieldSpecification,
  encodedValue: ValueItem
) {
  const valueSpec = schema.getValueTypeSpecification(encodedValue.type);
  if (!valueSpec) {
    throw new Error(`Couldn't find spec for value type ${encodedValue.type}`);
  }
  const decodedValue: ValueItem = { type: encodedValue.type };
  for (const fieldFieldSpec of valueSpec.fields) {
    const fieldName = fieldFieldSpec.name;
    const fieldValue = encodedValue[fieldName];
    decodedValue[fieldName] = decodeFieldItemOrList(schema, fieldFieldSpec, fieldValue);
  }

  return decodedValue;
}

function decodeRichTextField(encodedValue: RichText): RichText {
  return encodedValue;
}

export function decodeAdminEntity(
  schema: AdminSchema,
  values: DatabaseAdminEntityPayload
): AdminEntity {
  const entitySpec = schema.getEntityTypeSpecification(values.type);
  if (!entitySpec) {
    throw new Error(`No entity spec for type ${values.type}`);
  }

  const entity: AdminEntity = {
    id: values.id,
    info: {
      type: values.type,
      name: values.name,
      version: values.version,
      authKey: values.authKey,
      status: values.status,
      createdAt: values.createdAt,
      updatedAt: values.updatedAt,
    },
    fields: decodeAdminEntityFields(schema, entitySpec, values.fieldValues),
  };

  return entity;
}

export function decodeAdminEntityFields(
  schema: AdminSchema | PublishedSchema,
  entitySpec: AdminEntityTypeSpecification | PublishedEntityTypeSpecification,
  fieldValues: Record<string, unknown>
): AdminEntity['fields'] {
  const fields: AdminEntity['fields'] = {};
  for (const fieldSpec of entitySpec.fields) {
    const { name: fieldName } = fieldSpec;
    const fieldValue = fieldValues[fieldName];
    fields[fieldName] = decodeFieldItemOrList(schema, fieldSpec, fieldValue);
  }
  return fields;
}

export function resolveCreateEntity(
  schema: AdminSchema,
  entity: AdminEntityCreate
): Result<AdminEntityCreate, typeof ErrorType.BadRequest> {
  if (!entity.info.type) {
    return notOk.BadRequest('Missing entity.info.type');
  }
  if (!entity.info.authKey) {
    return notOk.BadRequest('Missing entity.info.authKey');
  }
  if (entity.info.version && entity.info.version !== 0) {
    return notOk.BadRequest(`Unsupported version for create: ${entity.info.version}`);
  }

  const result: AdminEntityCreate = {
    info: {
      name: entity.info.name,
      type: entity.info.type,
      version: 0,
      authKey: entity.info.authKey,
    },
    fields: {},
  };

  const entitySpec = schema.getEntityTypeSpecification(result.info.type);
  if (!entitySpec) {
    return notOk.BadRequest(`Entity type ${result.info.type} doesn’t exist`);
  }

  const unsupportedFieldsResult = checkForUnsupportedFields(entitySpec, entity);
  if (unsupportedFieldsResult.isError()) {
    return unsupportedFieldsResult;
  }

  const fields: Record<string, unknown> = {};
  for (const fieldSpec of entitySpec.fields) {
    const fieldValue = normalizeFieldValue(
      schema,
      fieldSpec,
      entity.fields?.[fieldSpec.name] ?? null
    );
    fields[fieldSpec.name] = fieldValue;
  }
  result.fields = fields;

  return ok(result);
}

export function resolveUpdateEntity(
  schema: AdminSchema,
  entity: AdminEntityUpdate,
  entityInfo: DatabaseEntityUpdateGetEntityInfoPayload
): Result<{ changed: boolean; entity: AdminEntity }, typeof ErrorType.BadRequest> {
  if (entity.info?.type && entity.info.type !== entityInfo.type) {
    return notOk.BadRequest(
      `New type ${entity.info.type} doesn’t correspond to previous type ${entityInfo.type}`
    );
  }
  if (entity.info?.authKey && entity.info.authKey !== entityInfo.authKey) {
    return notOk.BadRequest(
      `New authKey ${entity.info.authKey} doesn’t correspond to previous authKey ${entityInfo.authKey}`
    );
  }

  const status =
    entityInfo.status === AdminEntityStatus.published
      ? AdminEntityStatus.modified
      : entityInfo.status;

  const result: AdminEntity = {
    id: entity.id,
    info: {
      name: entity.info?.name ?? entityInfo.name,
      type: entityInfo.type,
      version: entityInfo.version + 1,
      authKey: entityInfo.authKey,
      status,
      createdAt: entityInfo.createdAt,
      updatedAt: entityInfo.updatedAt,
    },
    fields: {},
  };

  const entitySpec = schema.getEntityTypeSpecification(result.info.type);
  if (!entitySpec) {
    return notOk.BadRequest(`Entity type ${result.info.type} doesn’t exist`);
  }

  const unsupportedFieldsResult = checkForUnsupportedFields(entitySpec, entity);
  if (unsupportedFieldsResult.isError()) {
    return unsupportedFieldsResult;
  }

  let changed = false;
  if (result.info.name !== entityInfo.name) {
    changed = true;
  }
  for (const fieldSpec of entitySpec.fields) {
    const fieldName = fieldSpec.name;
    const previousFieldValue = decodeFieldItemOrList(
      schema,
      fieldSpec,
      entityInfo.fieldValues[fieldName] ?? null
    );

    if (entity.fields && fieldName in entity.fields) {
      const newFieldValue = normalizeFieldValue(schema, fieldSpec, entity.fields[fieldName]);
      if (!isFieldValueEqual(previousFieldValue, newFieldValue)) {
        changed = true;
      }
      result.fields[fieldName] = newFieldValue;
    } else {
      result.fields[fieldName] = previousFieldValue;
    }
  }

  if (!changed) {
    result.info.version = entityInfo.version;
    result.info.status = entityInfo.status;
  }

  return ok({ changed, entity: result });
}

function checkForUnsupportedFields(
  entitySpec: AdminEntityTypeSpecification,
  entity: AdminEntityCreate | AdminEntityUpdate
): Result<void, typeof ErrorType.BadRequest> {
  if (!entity.fields) {
    return ok(undefined);
  }

  const unsupportedFieldNames = new Set(Object.keys(entity.fields));

  entitySpec.fields.forEach((it) => unsupportedFieldNames.delete(it.name));

  if (unsupportedFieldNames.size > 0) {
    return notOk.BadRequest(`Unsupported field names: ${[...unsupportedFieldNames].join(', ')}`);
  }
  return ok(undefined);
}

export async function encodeAdminEntity(
  schema: AdminSchema,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: AdminEntity | AdminEntityCreate
): PromiseResult<EncodeAdminEntityResult, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const assertion = ensureRequired({
    'entity.info.type': entity.info.type,
    'entity.info.name': entity.info.name,
  });
  if (assertion.isError()) {
    return assertion;
  }

  const { type, name } = entity.info;

  const entitySpec = schema.getEntityTypeSpecification(type);
  if (!entitySpec) {
    return notOk.BadRequest(`Entity type ${type} doesn’t exist`);
  }

  // Validate entity fields
  // TODO move all validation to this setup from the encoding
  // TODO consider not encoding data and use it as is
  const validateOptions = { validatePublish: false };
  for (const node of traverseAdminEntity(schema, ['entity'], entity)) {
    const validationError = validateTraverseNode(schema, node, validateOptions);
    if (validationError) {
      return notOk.BadRequest(
        `${visitorPathToString(validationError.path)}: ${validationError.message}`
      );
    }
  }

  const result: EncodeAdminEntityResult = {
    type,
    name,
    data: {},
    referenceIds: [],
    locations: [],
    fullTextSearchText: [],
  };
  for (const fieldSpec of entitySpec.fields) {
    if (entity.fields && fieldSpec.name in entity.fields) {
      const data = entity.fields[fieldSpec.name];
      if (data === null || data === undefined) {
        continue;
      }
      const prefix = `entity.fields.${fieldSpec.name}`;
      const encodeResult = encodeFieldItemOrList(schema, fieldSpec, prefix, data);
      if (encodeResult.isError()) {
        return encodeResult;
      }
      result.data[fieldSpec.name] = encodeResult.value;
    }
  }

  const { requestedReferences, locations, fullTextSearchText } = collectDataFromEntity(
    schema,
    entity
  );
  const resolveResult = await resolveRequestedEntityReferences(
    databaseAdapter,
    context,
    requestedReferences
  );
  if (resolveResult.isError()) {
    return resolveResult;
  }

  result.referenceIds.push(...resolveResult.value);
  result.locations.push(...locations);
  result.fullTextSearchText.push(...fullTextSearchText);

  return ok(result);
}

function encodeFieldItemOrList(
  schema: AdminSchema,
  fieldSpec: AdminFieldSpecification,
  prefix: string,
  data: unknown
): Result<unknown, typeof ErrorType.BadRequest> {
  const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
  if (fieldSpec.list) {
    if (!Array.isArray(data)) {
      return notOk.BadRequest(`${prefix}: expected list`);
    }
    const encodedItems: unknown[] = [];
    for (const decodedItem of data) {
      let encodedItemResult;
      if (isValueTypeItemField(fieldSpec, decodedItem)) {
        encodedItemResult = encodeValueItemField(schema, fieldSpec, prefix, decodedItem);
      } else if (isRichTextItemField(fieldSpec, decodedItem)) {
        encodedItemResult = encodeRichTextField(decodedItem);
      } else {
        encodedItemResult = fieldAdapter.encodeData(fieldSpec, prefix, decodedItem);
      }
      if (encodedItemResult.isError()) {
        return encodedItemResult;
      }
      encodedItems.push(encodedItemResult.value);
    }
    return ok(encodedItems);
  }

  if (isValueTypeField(fieldSpec, data)) {
    return encodeValueItemField(schema, fieldSpec, prefix, data);
  } else if (isRichTextField(fieldSpec, data)) {
    return encodeRichTextField(data);
  }
  return fieldAdapter.encodeData(fieldSpec, prefix, data);
}

function encodeValueItemField(
  schema: AdminSchema,
  fieldSpec: AdminFieldSpecification,
  prefix: string,
  data: ValueItem | null
): Result<unknown, typeof ErrorType.BadRequest> {
  if (Array.isArray(data)) {
    return notOk.BadRequest(`${prefix}: expected single value, got list`);
  }
  if (typeof data !== 'object' || !data) {
    return notOk.BadRequest(`${prefix}: expected object, got ${typeof data}`);
  }
  const value = data as ValueItem;
  const valueType = value.type;
  if (!valueType) {
    return notOk.BadRequest(`${prefix}: missing type`);
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
  unsupportedFields.delete('type');
  valueSpec.fields.forEach((x) => unsupportedFields.delete(x.name));
  if (unsupportedFields.size > 0) {
    return notOk.BadRequest(
      `${prefix}: Unsupported field names: ${[...unsupportedFields].join(', ')}`
    );
  }

  const encodedValue: ValueItem = { type: valueType };

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

function encodeRichTextField(
  data: RichText | null
): Result<RichText | null, typeof ErrorType.BadRequest> {
  return ok(data);
}

export function collectDataFromEntity(
  schema: AdminSchema,
  entity: EntityLike
): {
  requestedReferences: RequestedReference[];
  locations: Location[];
  fullTextSearchText: string[];
} {
  const requestedReferences: RequestedReference[] = [];
  const locations: Location[] = [];
  const fullTextSearchText: string[] = [];

  // TODO migrate to traverseAdminEntity, see createFullTextSearchCollector()

  visitItemRecursively({
    schema,
    item: entity,
    path: ['entity'],
    visitField: (path, fieldSpec, data, _visitContext) => {
      if (fieldSpec.type !== FieldType.ValueType && fieldSpec.type !== FieldType.RichText) {
        const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
        const uuids = fieldAdapter.getReferenceUUIDs(data);
        if (uuids && uuids.length > 0) {
          requestedReferences.push({
            prefix: visitorPathToString(path),
            uuids,
            entityTypes: fieldSpec.entityTypes,
          });
        }
      }

      if (isLocationItemField(fieldSpec, data) && data) {
        locations.push(data);
      } else if (isStringItemField(fieldSpec, data) && data) {
        fullTextSearchText.push(data);
      }
    },
    visitRichTextNode: (path, fieldSpec, node, _visitContext) => {
      if (isRichTextEntityNode(node) && node.reference) {
        requestedReferences.push({
          prefix: visitorPathToString(path),
          uuids: [node.reference.id],
          entityTypes: fieldSpec.entityTypes,
        });
      } else if (isRichTextTextNode(node)) {
        const text = node.text;
        if (text) {
          fullTextSearchText.push(text);
        }
      } else if (isRichTextValueItemNode(node)) {
        // skip since visitField will be called
      }
    },
    initialVisitContext: undefined,
  });

  return { requestedReferences, locations, fullTextSearchText };
}

async function resolveRequestedEntityReferences(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  requestedReferences: RequestedReference[]
): PromiseResult<
  DatabaseResolvedEntityReference[],
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const allUUIDs = new Set<string>();
  requestedReferences.forEach(({ uuids }) => uuids.forEach((uuid) => allUUIDs.add(uuid)));

  if (allUUIDs.size === 0) {
    return ok([]);
  }

  const result = await databaseAdapter.adminEntityGetReferenceEntitiesInfo(
    context,
    [...allUUIDs].map((id) => ({ id }))
  );
  if (result.isError()) {
    return result;
  }

  const items = result.value;

  for (const request of requestedReferences) {
    for (const uuid of request.uuids) {
      const item = items.find((it) => it.id === uuid);
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

  return ok(items.map(({ entityInternalId }) => ({ entityInternalId })));
}

export const forTest = {
  collectDataFromEntity,
};
