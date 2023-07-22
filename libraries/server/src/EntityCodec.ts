import {
  AdminEntityStatus,
  FieldType,
  ItemTraverseNodeType,
  assertExhaustive,
  isFieldValueEqual,
  isRichTextField,
  isRichTextItemField,
  isRichTextValueItemNode,
  isValueItemField,
  isValueItemItemField,
  normalizeEntityFields,
  notOk,
  ok,
  traverseEntity,
  validateTraverseNodeForSave,
  visitorPathToString,
  type AdminEntity,
  type AdminEntityCreate,
  type AdminEntityTypeSpecification,
  type AdminEntityUpdate,
  type AdminFieldSpecification,
  type AdminSchema,
  type AdminSchemaMigrationAction,
  type AdminSchemaWithMigrations,
  type ErrorType,
  type PromiseResult,
  type PublishedEntity,
  type PublishedFieldSpecification,
  type PublishedSchema,
  type Result,
  type RichText,
  type RichTextValueItemNode,
  type ValueItem,
  type ValueItemFieldSpecification,
} from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabaseAdminEntityPayload,
  DatabaseEntityIndexesArg,
  DatabaseEntityUpdateGetEntityInfoPayload,
  DatabasePublishedEntityPayload,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@dossierhq/database-adapter';
import {
  createFullTextSearchCollector,
  createLocationsCollector,
  createRequestedReferencesCollector,
  createUniqueIndexCollector,
  createValueTypesCollector,
  type RequestedReference,
  type UniqueIndexValueCollection,
} from './EntityCollectors.js';
import * as EntityFieldTypeAdapters from './EntityFieldTypeAdapters.js';
import { transformRichText } from './utils/RichTextTransformer.js';

export interface EncodeAdminEntityResult {
  type: string;
  name: string;
  data: Record<string, unknown>;
  entityIndexes: DatabaseEntityIndexesArg;
  uniqueIndexValues: UniqueIndexValueCollection;
}

/** `optimized` is the original way of encoding/decoding values, using type adapters and saving less
 * data than the json. Used by entity fields, and value items in entities.
 * For Rich Text, `json` is used, which means values are saved as is. Value items within rich text
 * are encoded as `json`.
 */
export type CodecMode = 'optimized' | 'json';

export function decodePublishedEntity(
  adminSchema: AdminSchemaWithMigrations,
  values: DatabasePublishedEntityPayload,
): PublishedEntity {
  const publishedSchema = adminSchema.toPublishedSchema();
  const entitySpec = publishedSchema.getEntityTypeSpecification(values.type);
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
      valid: values.validPublished,
    },
    fields: {},
  };

  const migratedFieldValues = applySchemaMigrationsToFieldValues(
    adminSchema,
    values.type,
    values.schemaVersion,
    values.fieldValues,
  );

  for (const fieldSpec of entitySpec.fields) {
    const { name: fieldName } = fieldSpec;
    const fieldValue = migratedFieldValues[fieldName];
    entity.fields[fieldName] = decodeFieldItemOrList(
      publishedSchema,
      fieldSpec,
      'optimized',
      fieldValue,
    );
  }

  return entity;
}

function applySchemaMigrationsToFieldValues(
  adminSchema: AdminSchemaWithMigrations,
  entityType: string,
  schemaVersion: number,
  fieldValues: Record<string, unknown>,
): Record<string, unknown> {
  const actions = adminSchema.collectMigrationActionsSinceVersion(schemaVersion);

  if (actions.length === 0) {
    return fieldValues;
  }

  const entityTypeActions: Exclude<AdminSchemaMigrationAction, { valueType: string }>[] = [];
  const valueTypeActions: Exclude<AdminSchemaMigrationAction, { entityType: string }>[] = [];
  for (const action of actions) {
    if ('entityType' in action) {
      entityTypeActions.push(action);
    } else {
      valueTypeActions.push(action);
    }
  }

  const migratedFieldValues = JSON.parse(JSON.stringify(fieldValues)) as Record<string, unknown>;

  for (const actionSpec of entityTypeActions) {
    const { action } = actionSpec;
    switch (action) {
      case 'deleteField': {
        if (actionSpec.entityType === entityType) {
          delete migratedFieldValues[actionSpec.field];
        }
        break;
      }
      case 'renameField': {
        if (actionSpec.entityType === entityType) {
          if (actionSpec.field in migratedFieldValues) {
            migratedFieldValues[actionSpec.newName] = migratedFieldValues[actionSpec.field];
            delete migratedFieldValues[actionSpec.field];
          }
        }
        break;
      }
      case 'deleteType': {
        //TODO
        break;
      }
      case 'renameType': {
        //TODO
        break;
      }
      default:
        assertExhaustive(action);
    }
  }

  if (valueTypeActions.length > 0) {
    for (const node of traverseEntity(adminSchema, ['entity'], {
      info: { type: entityType },
      fields: migratedFieldValues,
    })) {
      if (node.type === ItemTraverseNodeType.valueItem) {
        const valueItem = node.valueItem;
        for (const actionSpec of valueTypeActions) {
          const { action } = actionSpec;
          switch (action) {
            case 'deleteField': {
              if (actionSpec.valueType === valueItem.type) {
                delete valueItem[actionSpec.field];
              }
              break;
            }
            case 'renameField': {
              if (actionSpec.valueType === valueItem.type) {
                if (actionSpec.field in valueItem) {
                  valueItem[actionSpec.newName] = valueItem[actionSpec.field];
                  delete valueItem[actionSpec.field];
                }
              }
              break;
            }
            case 'deleteType': {
              //TODO
              break;
            }
            case 'renameType': {
              //TODO
              break;
            }
            default:
              assertExhaustive(action);
          }
        }
      }
    }
  }

  return migratedFieldValues;
}

function decodeFieldItemOrList(
  schema: AdminSchema | PublishedSchema,
  fieldSpec: AdminFieldSpecification | PublishedFieldSpecification,
  codecMode: CodecMode,
  fieldValue: unknown,
) {
  if (fieldValue === null || fieldValue === undefined) {
    return null;
  }
  const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
  if (fieldSpec.list) {
    if (!Array.isArray(fieldValue)) {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions
      throw new Error(`Expected list but got ${fieldValue} (${fieldSpec.name})`);
    }
    const decodedItems: unknown[] = [];
    for (const encodedItem of fieldValue) {
      if (fieldSpec.type === FieldType.ValueItem) {
        const decodedItem = decodeValueItemField(
          schema,
          fieldSpec,
          codecMode,
          encodedItem as ValueItem,
        );
        decodedItems.push(decodedItem);
      } else if (fieldSpec.type === FieldType.RichText) {
        decodedItems.push(decodeRichTextField(schema, fieldSpec, encodedItem as RichText));
      } else {
        decodedItems.push(
          codecMode === 'optimized'
            ? fieldAdapter.decodeData(encodedItem)
            : fieldAdapter.decodeJson(encodedItem),
        );
      }
    }
    return decodedItems;
  }
  if (fieldSpec.type === FieldType.ValueItem) {
    return decodeValueItemField(schema, fieldSpec, codecMode, fieldValue as ValueItem);
  }
  if (fieldSpec.type === FieldType.RichText) {
    return decodeRichTextField(schema, fieldSpec, fieldValue as RichText);
  }
  return codecMode === 'optimized'
    ? fieldAdapter.decodeData(fieldValue)
    : fieldAdapter.decodeJson(fieldValue);
}

function decodeValueItemField(
  schema: AdminSchema | PublishedSchema,
  _fieldSpec: AdminFieldSpecification | PublishedFieldSpecification,
  codecMode: CodecMode,
  encodedValue: ValueItem,
) {
  const valueSpec = schema.getValueTypeSpecification(encodedValue.type);
  if (!valueSpec) {
    throw new Error(`Couldn't find spec for value type ${encodedValue.type}`);
  }
  const decodedValue: ValueItem = { type: encodedValue.type };
  for (const fieldFieldSpec of valueSpec.fields) {
    const fieldName = fieldFieldSpec.name;
    const fieldValue = encodedValue[fieldName];
    decodedValue[fieldName] = decodeFieldItemOrList(schema, fieldFieldSpec, codecMode, fieldValue);
  }

  return decodedValue;
}

function decodeRichTextField(
  schema: AdminSchema | PublishedSchema,
  fieldSpec: AdminFieldSpecification | PublishedFieldSpecification,
  encodedValue: RichText,
): RichText {
  return transformRichText(encodedValue, (node) => {
    if (isRichTextValueItemNode(node)) {
      const newNode: RichTextValueItemNode = {
        ...node,
        data: decodeValueItemField(schema, fieldSpec, 'json', node.data),
      };
      return newNode;
    }
    return node;
  });
}

export function decodeAdminEntity(
  schema: AdminSchemaWithMigrations,
  values: DatabaseAdminEntityPayload,
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
      valid: values.valid,
      validPublished: values.validPublished,
      createdAt: values.createdAt,
      updatedAt: values.updatedAt,
    },
    fields: decodeAdminEntityFields(schema, entitySpec, values.schemaVersion, values.fieldValues),
  };

  return entity;
}

export function decodeAdminEntityFields(
  schema: AdminSchemaWithMigrations,
  entitySpec: AdminEntityTypeSpecification,
  schemaVersion: number,
  fieldValues: Record<string, unknown>,
): AdminEntity['fields'] {
  const migratedFieldValues = applySchemaMigrationsToFieldValues(
    schema,
    entitySpec.name,
    schemaVersion,
    fieldValues,
  );

  const fields: AdminEntity['fields'] = {};
  for (const fieldSpec of entitySpec.fields) {
    const { name: fieldName } = fieldSpec;
    const fieldValue = migratedFieldValues[fieldName];
    fields[fieldName] = decodeFieldItemOrList(schema, fieldSpec, 'optimized', fieldValue);
  }
  return fields;
}

export function resolveCreateEntity(
  schema: AdminSchema,
  entity: AdminEntityCreate,
): Result<
  { createEntity: AdminEntityCreate; entitySpec: AdminEntityTypeSpecification },
  typeof ErrorType.BadRequest
> {
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

  const normalizedResult = normalizeEntityFields(schema, entity);
  if (normalizedResult.isError()) return normalizedResult;
  result.fields = normalizedResult.value;

  return ok({ createEntity: result, entitySpec });
}

export function resolveUpdateEntity(
  schema: AdminSchemaWithMigrations,
  entity: AdminEntityUpdate,
  entityInfo: DatabaseEntityUpdateGetEntityInfoPayload,
): Result<
  { changed: boolean; entity: AdminEntity; entitySpec: AdminEntityTypeSpecification },
  typeof ErrorType.BadRequest
> {
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
      valid: true,
      validPublished: entityInfo.validPublished,
      createdAt: entityInfo.createdAt,
      updatedAt: entityInfo.updatedAt,
    },
    fields: {},
  };

  const entitySpec = schema.getEntityTypeSpecification(result.info.type);
  if (!entitySpec) {
    return notOk.BadRequest(`Entity type ${result.info.type} doesn’t exist`);
  }

  const migratedFieldValues = applySchemaMigrationsToFieldValues(
    schema,
    entitySpec.name,
    entityInfo.schemaVersion,
    entityInfo.fieldValues,
  );

  const normalizedResult = normalizeEntityFields(
    schema,
    { ...entity, info: { type: result.info.type } },
    { excludeOmitted: true },
  );
  if (normalizedResult.isError()) return normalizedResult;
  const normalizedFields = normalizedResult.value;

  let changed = false;
  if (result.info.name !== entityInfo.name) {
    changed = true;
  }
  for (const fieldSpec of entitySpec.fields) {
    const fieldName = fieldSpec.name;
    const previousFieldValue = decodeFieldItemOrList(
      schema,
      fieldSpec,
      'optimized',
      migratedFieldValues[fieldName] ?? null,
    );

    if (fieldName in normalizedFields) {
      const newFieldValue = normalizedFields[fieldName];
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
    result.info.valid = entityInfo.valid;

    if (!result.info.valid) {
      return notOk.BadRequest('No change to entity that is already invalid');
    }
  }

  return ok({ changed, entity: result, entitySpec });
}

export async function encodeAdminEntity(
  schema: AdminSchema,
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  entitySpec: AdminEntityTypeSpecification,
  entity: AdminEntity | AdminEntityCreate,
): PromiseResult<EncodeAdminEntityResult, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  // Collect values and validate entity fields
  const ftsCollector = createFullTextSearchCollector();
  const referencesCollector = createRequestedReferencesCollector();
  const locationsCollector = createLocationsCollector();
  const valueTypesCollector = createValueTypesCollector();
  const uniqueIndexCollector = createUniqueIndexCollector(schema);

  // TODO move all validation to this setup from the encoding
  // TODO consider not encoding data and use it as is
  for (const node of traverseEntity(schema, ['entity'], entity)) {
    const validationIssue = validateTraverseNodeForSave(schema, node);
    if (validationIssue) {
      return notOk.BadRequest(
        `${visitorPathToString(validationIssue.path)}: ${validationIssue.message}`,
      );
    }
    ftsCollector.collect(node);
    referencesCollector.collect(node);
    locationsCollector.collect(node);
    valueTypesCollector.collect(node);
    uniqueIndexCollector.collect(node);
  }

  const result: EncodeAdminEntityResult = {
    type: entity.info.type,
    name: entity.info.name,
    data: {},
    entityIndexes: {
      referenceIds: [],
      locations: locationsCollector.result,
      valueTypes: valueTypesCollector.result,
      fullTextSearchText: ftsCollector.result,
    },
    uniqueIndexValues: uniqueIndexCollector.result,
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

  const resolveResult = await resolveRequestedEntityReferences(
    databaseAdapter,
    context,
    referencesCollector.result,
  );
  if (resolveResult.isError()) return resolveResult;
  result.entityIndexes.referenceIds.push(...resolveResult.value);

  return ok(result);
}

function encodeFieldItemOrList(
  schema: AdminSchema,
  fieldSpec: AdminFieldSpecification,
  prefix: string,
  data: unknown,
): Result<unknown, typeof ErrorType.BadRequest> {
  const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
  if (fieldSpec.list) {
    if (!Array.isArray(data)) {
      return notOk.BadRequest(`${prefix}: expected list`);
    }
    const encodedItems: unknown[] = [];
    for (const decodedItem of data) {
      let encodedItemResult;
      if (isValueItemItemField(fieldSpec, decodedItem)) {
        encodedItemResult = encodeValueItemField(
          schema,
          fieldSpec as AdminFieldSpecification<ValueItemFieldSpecification>,
          prefix,
          decodedItem,
        );
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

  if (isValueItemField(fieldSpec, data)) {
    return encodeValueItemField(
      schema,
      fieldSpec as AdminFieldSpecification<ValueItemFieldSpecification>,
      prefix,
      data,
    );
  } else if (isRichTextField(fieldSpec, data)) {
    return encodeRichTextField(data);
  }
  return fieldAdapter.encodeData(fieldSpec, prefix, data);
}

function encodeValueItemField(
  schema: AdminSchema,
  fieldSpec: AdminFieldSpecification<ValueItemFieldSpecification>,
  prefix: string,
  data: ValueItem | null,
): Result<unknown, typeof ErrorType.BadRequest> {
  if (Array.isArray(data)) {
    return notOk.BadRequest(`${prefix}: expected single value, got list`);
  }
  if (typeof data !== 'object' || !data) {
    return notOk.BadRequest(`${prefix}: expected object, got ${typeof data}`);
  }
  const value = data;
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
      `${prefix}: Unsupported field names: ${[...unsupportedFields].join(', ')}`,
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
      fieldValue,
    );
    if (encodedField.isError()) {
      return encodedField;
    }
    encodedValue[fieldSpec.name] = encodedField.value;
  }

  return ok(encodedValue);
}

function encodeRichTextField(
  data: RichText | null,
): Result<RichText | null, typeof ErrorType.BadRequest> {
  return ok(data);
}

async function resolveRequestedEntityReferences(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  requestedReferences: RequestedReference[],
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
    [...allUUIDs].map((id) => ({ id })),
  );
  if (result.isError()) {
    return result;
  }

  const items = result.value;

  for (const request of requestedReferences) {
    for (const uuid of request.uuids) {
      const item = items.find((it) => it.id === uuid);
      if (!item) {
        return notOk.BadRequest(`${request.prefix}: Referenced entity (${uuid}) doesn’t exist`);
      }
      if (request.isRichTextLink && request.linkEntityTypes && request.linkEntityTypes.length > 0) {
        if (request.linkEntityTypes.indexOf(item.type) < 0) {
          return notOk.BadRequest(
            `${request.prefix}: Linked entity (${uuid}) has an invalid type ${item.type}`,
          );
        }
      } else if (request.entityTypes && request.entityTypes.length > 0) {
        if (request.entityTypes.indexOf(item.type) < 0) {
          return notOk.BadRequest(
            `${request.prefix}: Referenced entity (${uuid}) has an invalid type ${item.type}`,
          );
        }
      }
    }
  }

  return ok(items.map(({ entityInternalId }) => ({ entityInternalId })));
}
