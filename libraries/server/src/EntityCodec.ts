import {
  AdminEntityStatus,
  FieldType,
  assertExhaustive,
  assertIsDefined,
  isFieldValueEqual,
  isRichTextField,
  isRichTextItemField,
  isRichTextValueItemNode,
  isValueItemField,
  isValueItemItemField,
  normalizeEntityFields,
  notOk,
  ok,
  transformEntityFields,
  transformRichText,
  type AdminEntity,
  type AdminEntityCreate,
  type AdminEntityTypeSpecification,
  type AdminEntityUpdate,
  type AdminFieldSpecification,
  type AdminSchema,
  type AdminSchemaMigrationAction,
  type AdminSchemaWithMigrations,
  type ContentValuePath,
  type ErrorType,
  type PromiseResult,
  type PublishedEntity,
  type PublishedFieldSpecification,
  type PublishedSchema,
  type Result,
  type RichText,
  type RichTextValueItemNode,
  type SaveValidationIssue,
  type ValueItem,
} from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabaseAdminEntityPayload,
  DatabaseEntityIndexesArg,
  DatabaseEntityUpdateGetEntityInfoPayload,
  DatabasePublishedEntityPayload,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { type UniqueIndexValueCollection } from './EntityCollectors.js';
import * as EntityFieldTypeAdapters from './EntityFieldTypeAdapters.js';
import {
  validateAdminFieldValuesAndCollectInfo,
  validateReferencedEntitiesForSaveAndCollectInfo,
} from './EntityValidator.js';

export interface EncodeAdminEntityResult {
  validationIssues: SaveValidationIssue[];
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
): Result<PublishedEntity, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const publishedSchema = adminSchema.toPublishedSchema();
  const entitySpec = publishedSchema.getEntityTypeSpecification(values.type);
  if (!entitySpec) {
    return notOk.BadRequest(`No entity spec for type ${values.type} (id: ${values.id})`);
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

  const migratedFieldValuesResult = applySchemaMigrationsToFieldValues(
    adminSchema,
    values.type,
    values.schemaVersion,
    values.fieldValues,
  );
  if (migratedFieldValuesResult.isError()) return migratedFieldValuesResult;
  const migratedFieldValues = migratedFieldValuesResult.value;

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

  return ok(entity);
}

function applySchemaMigrationsToFieldValues(
  adminSchema: AdminSchemaWithMigrations,
  targetEntityType: string,
  schemaVersion: number,
  fieldValues: Record<string, unknown>,
): Result<Record<string, unknown>, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const actions = adminSchema.collectMigrationActionsSinceVersion(schemaVersion);

  if (actions.length === 0) {
    return ok(fieldValues);
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

  const startingEntityType = getStartingEntityType(targetEntityType, entityTypeActions);

  const migratedFieldValues = migrateEntityFields(
    startingEntityType,
    fieldValues,
    entityTypeActions,
  );

  const transformResult: Result<
    Record<string, unknown>,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  > = transformEntityFields(
    adminSchema,
    [],
    { info: { type: targetEntityType }, fields: migratedFieldValues },
    {
      transformField: (_path, _fieldSpec, value) => {
        return ok(value);
      },
      transformFieldItem: (_path, fieldSpec, value) => {
        if (isValueItemItemField(fieldSpec, value) && value) {
          return ok(migrateValueItem(value, valueTypeActions));
        }
        return ok(value);
      },
      transformRichTextNode: (_path, _fieldSpec, node) => {
        if (isRichTextValueItemNode(node)) {
          const valueItem = migrateValueItem(node.data, valueTypeActions);
          if (!valueItem) return ok(null);
          return ok({ ...node, data: valueItem });
        }
        return ok(node);
      },
    },
  );

  if (transformResult.isError()) return transformResult;
  return ok(transformResult.value);
}

function getStartingEntityType(
  targetEntityType: string,
  entityTypeActions: Exclude<AdminSchemaMigrationAction, { valueType: string }>[],
) {
  let entityType = targetEntityType;
  for (let i = entityTypeActions.length - 1; i >= 0; i--) {
    const action = entityTypeActions[i];
    if (action.action === 'renameType' && action.newName === entityType) {
      entityType = action.entityType;
    }
  }
  return entityType;
}

function migrateEntityFields(
  startingEntityType: string,
  originalFields: Record<string, unknown>,
  entityTypeActions: Exclude<AdminSchemaMigrationAction, { valueType: string }>[],
) {
  let changed = false;
  let entityType = startingEntityType;
  const migratedFields = { ...originalFields };
  for (const actionSpec of entityTypeActions) {
    const { action } = actionSpec;
    switch (action) {
      case 'deleteField':
        if (actionSpec.entityType === entityType) {
          delete migratedFields[actionSpec.field];
          changed = true;
        }
        break;
      case 'renameField':
        if (actionSpec.entityType === entityType) {
          if (actionSpec.field in migratedFields) {
            migratedFields[actionSpec.newName] = migratedFields[actionSpec.field];
            delete migratedFields[actionSpec.field];
            changed = true;
          }
        }
        break;
      case 'renameType':
        if (actionSpec.entityType === entityType) {
          entityType = actionSpec.newName;
        }
        break;
    }
  }
  return changed ? migratedFields : originalFields;
}

function migrateValueItem(
  originalValueItem: ValueItem | null,
  valueTypeActions: Exclude<AdminSchemaMigrationAction, { entityType: string }>[],
): ValueItem | null {
  if (!originalValueItem) return null;

  const valueItem = { ...originalValueItem };

  for (const actionSpec of valueTypeActions) {
    const { action } = actionSpec;
    switch (action) {
      case 'deleteField':
        if (actionSpec.valueType === valueItem.type) {
          delete valueItem[actionSpec.field];
        }
        break;
      case 'renameField':
        if (actionSpec.valueType === valueItem.type) {
          if (actionSpec.field in valueItem) {
            valueItem[actionSpec.newName] = valueItem[actionSpec.field];
            delete valueItem[actionSpec.field];
          }
        }
        break;
      case 'deleteType':
        if (actionSpec.valueType === valueItem.type) {
          return null;
        }
        break;
      case 'renameType':
        if (actionSpec.valueType === valueItem.type) {
          valueItem.type = actionSpec.newName;
        }
        break;
      default:
        assertExhaustive(action);
    }
  }
  return valueItem;
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
        const decodedItem = decodeValueItemField(schema, codecMode, encodedItem as ValueItem);
        if (decodedItem) {
          decodedItems.push(decodedItem);
        }
      } else if (fieldSpec.type === FieldType.RichText) {
        decodedItems.push(decodeRichTextField(schema, encodedItem as RichText));
      } else {
        decodedItems.push(
          codecMode === 'optimized'
            ? fieldAdapter.decodeData(encodedItem)
            : fieldAdapter.decodeJson(encodedItem),
        );
      }
    }
    return decodedItems.length > 0 ? decodedItems : null;
  }
  if (fieldSpec.type === FieldType.ValueItem) {
    return decodeValueItemField(schema, codecMode, fieldValue as ValueItem);
  }
  if (fieldSpec.type === FieldType.RichText) {
    return decodeRichTextField(schema, fieldValue as RichText);
  }
  return codecMode === 'optimized'
    ? fieldAdapter.decodeData(fieldValue)
    : fieldAdapter.decodeJson(fieldValue);
}

function decodeValueItemField(
  schema: AdminSchema | PublishedSchema,
  codecMode: CodecMode,
  encodedValue: ValueItem,
): ValueItem | null {
  const valueSpec = schema.getValueTypeSpecification(encodedValue.type);
  if (!valueSpec) {
    // Could be that the value type was deleted or made adminOnly (when decoding published entities)
    return null;
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
  encodedValue: RichText,
): RichText | null {
  //TODO add paths to decoding
  const path: ContentValuePath = [];
  return transformRichText(path, encodedValue, (_path, node) => {
    if (isRichTextValueItemNode(node)) {
      const data = decodeValueItemField(schema, 'json', node.data);
      if (!data) {
        return ok(null);
      }
      const newNode: RichTextValueItemNode = { ...node, data };
      return ok(newNode);
    }
    return ok(node);
  }).valueOrThrow();
}

export function decodeAdminEntity(
  schema: AdminSchemaWithMigrations,
  values: DatabaseAdminEntityPayload,
): Result<AdminEntity, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const entitySpec = schema.getEntityTypeSpecification(values.type);
  if (!entitySpec) {
    return notOk.BadRequest(`No entity spec for type ${values.type}`);
  }

  const decodedResult = decodeAdminEntityFields(
    schema,
    entitySpec,
    values.schemaVersion,
    values.fieldValues,
  );
  if (decodedResult.isError()) return decodedResult;
  const fields = decodedResult.value;

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
    fields,
  };

  return ok(entity);
}

export function decodeAdminEntityFields(
  schema: AdminSchemaWithMigrations,
  entitySpec: AdminEntityTypeSpecification,
  schemaVersion: number,
  fieldValues: Record<string, unknown>,
): Result<AdminEntity['fields'], typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const migratedFieldValuesResult = applySchemaMigrationsToFieldValues(
    schema,
    entitySpec.name,
    schemaVersion,
    fieldValues,
  );
  if (migratedFieldValuesResult.isError()) return migratedFieldValuesResult;
  const migratedFieldValues = migratedFieldValuesResult.value;

  const fields: AdminEntity['fields'] = {};
  for (const fieldSpec of entitySpec.fields) {
    const { name: fieldName } = fieldSpec;
    const fieldValue = migratedFieldValues[fieldName];
    fields[fieldName] = decodeFieldItemOrList(schema, fieldSpec, 'optimized', fieldValue);
  }
  return ok(fields);
}

export function resolveCreateEntity(
  schema: AdminSchema,
  entity: AdminEntityCreate,
): Result<
  { createEntity: AdminEntityCreate; entitySpec: AdminEntityTypeSpecification },
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
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

  // Keep extra fields so we can fail on validation
  const normalizedResult = normalizeEntityFields(schema, ['entity'], entity, {
    keepExtraFields: true,
  });
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
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
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

  const migratedExistingFieldsResult = applySchemaMigrationsToFieldValues(
    schema,
    entitySpec.name,
    entityInfo.schemaVersion,
    entityInfo.fieldValues,
  );
  if (migratedExistingFieldsResult.isError()) return migratedExistingFieldsResult;
  const migratedExistingFields = migratedExistingFieldsResult.value;

  // Keep extra fields so we can fail on validation
  const normalizedUpdateFieldsResult = normalizeEntityFields(
    schema,
    ['entity'],
    { ...entity, info: { type: result.info.type } },
    { excludeOmittedEntityFields: true, keepExtraFields: true },
  );
  if (normalizedUpdateFieldsResult.isError()) return normalizedUpdateFieldsResult;
  const normalizedUpdateFields = normalizedUpdateFieldsResult.value;

  const invalidUpdateFieldNames = new Set(Object.keys(normalizedUpdateFields));

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
      migratedExistingFields[fieldName] ?? null,
    );

    invalidUpdateFieldNames.delete(fieldName);
    if (fieldName in normalizedUpdateFields) {
      const newFieldValue = normalizedUpdateFields[fieldName];
      if (!isFieldValueEqual(previousFieldValue, newFieldValue)) {
        changed = true;
      }
      result.fields[fieldName] = newFieldValue;
    } else {
      result.fields[fieldName] = previousFieldValue;
    }
  }

  if (invalidUpdateFieldNames.size > 0) {
    return notOk.BadRequest(
      `entity.fields: ${entitySpec.name} does not include the fields: ${[
        ...invalidUpdateFieldNames,
      ].join(', ')}`,
    );
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
): PromiseResult<EncodeAdminEntityResult, typeof ErrorType.Generic> {
  // Collect values and validate entity fields
  const path = ['entity'];
  const validation = validateAdminFieldValuesAndCollectInfo(schema, path, entity);

  // TODO consider not encoding data and use it as is

  const result: EncodeAdminEntityResult = {
    validationIssues: validation.validationIssues,
    type: entity.info.type,
    name: entity.info.name,
    data: {},
    entityIndexes: {
      referenceIds: [],
      locations: validation.locations,
      valueTypes: validation.valueTypes,
      fullTextSearchText: validation.fullTextSearchText,
    },
    uniqueIndexValues: validation.uniqueIndexValues,
  };
  for (const fieldSpec of entitySpec.fields) {
    if (entity.fields && fieldSpec.name in entity.fields) {
      const data = entity.fields[fieldSpec.name];
      if (data === null || data === undefined) {
        continue;
      }
      const fieldPath = [...path, 'fields', fieldSpec.name];
      const encodedValue = encodeFieldItemOrList(schema, fieldSpec, fieldPath, data);
      result.data[fieldSpec.name] = encodedValue;
    }
  }

  // Validate and resolve references
  const referencesResult = await validateReferencedEntitiesForSaveAndCollectInfo(
    databaseAdapter,
    context,
    validation.references,
  );
  if (referencesResult.isError()) return referencesResult;
  result.validationIssues.push(...referencesResult.value.validationIssues);
  result.entityIndexes.referenceIds.push(...referencesResult.value.references);

  return ok(result);
}

function encodeFieldItemOrList(
  schema: AdminSchema,
  fieldSpec: AdminFieldSpecification,
  path: ContentValuePath,
  data: unknown,
) {
  const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
  if (fieldSpec.list) {
    const encodedItems: unknown[] = [];
    for (let i = 0; i < (data as []).length; i++) {
      const decodedItem = (data as unknown[])[i];
      const itemPath = [...path, i];

      let encodedItem: unknown;
      if (isValueItemItemField(fieldSpec, decodedItem)) {
        encodedItem = encodeValueItemField(schema, itemPath, decodedItem);
      } else if (isRichTextItemField(fieldSpec, decodedItem)) {
        encodedItem = encodeRichTextField(decodedItem);
      } else {
        encodedItem = fieldAdapter.encodeData(decodedItem);
      }
      if (encodedItem !== null) {
        encodedItems.push(encodedItem);
      }
    }
    return encodedItems.length > 0 ? encodedItems : null;
  }

  if (isValueItemField(fieldSpec, data)) {
    return encodeValueItemField(schema, path, data);
  } else if (isRichTextField(fieldSpec, data)) {
    return encodeRichTextField(data);
  }
  return fieldAdapter.encodeData(data);
}

function encodeValueItemField(
  schema: AdminSchema,
  path: ContentValuePath,
  data: ValueItem | null,
): ValueItem | null {
  if (!data) return null;

  const value = data;
  const valueType = value.type;
  const valueSpec = schema.getValueTypeSpecification(valueType);
  assertIsDefined(valueSpec);

  const encodedValue: ValueItem = { type: valueType };

  for (const fieldSpec of valueSpec.fields) {
    const fieldValue = value[fieldSpec.name];
    if (fieldValue === null || fieldValue === undefined) {
      continue; // Skip empty fields
    }
    const fieldPath = [...path, fieldSpec.name];
    const encodedFieldValue = encodeFieldItemOrList(schema, fieldSpec, fieldPath, fieldValue);
    encodedValue[fieldSpec.name] = encodedFieldValue;
  }

  return encodedValue;
}

function encodeRichTextField(data: RichText | null) {
  return data;
}

export const forTest = {
  applySchemaMigrationsToFieldValues,
};
