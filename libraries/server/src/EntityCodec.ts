import {
  AdminEntityStatus,
  assertExhaustive,
  isFieldValueEqual,
  isRichTextValueItemNode,
  isValueItemItemField,
  normalizeEntityFields,
  notOk,
  ok,
  transformEntityFields,
  type AdminEntity,
  type AdminEntityCreate,
  type AdminEntityTypeSpecification,
  type AdminEntityUpdate,
  type AdminSchema,
  type AdminSchemaMigrationAction,
  type AdminSchemaWithMigrations,
  type ErrorType,
  type PromiseResult,
  type PublishedEntity,
  type Result,
  type SaveValidationIssue,
  type ValueItem,
} from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabaseAdminEntityPayload,
  DatabaseEntityFieldsPayload,
  DatabaseEntityIndexesArg,
  DatabaseEntityUpdateGetEntityInfoPayload,
  DatabasePublishedEntityPayload,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { type UniqueIndexValueCollection } from './EntityCollectors.js';
import {
  validateAdminFieldValuesAndCollectInfo,
  validateReferencedEntitiesForSaveAndCollectInfo,
} from './EntityValidator.js';
import { legacyDecodeEntityFields } from './shared-entity/legacyDecodeEntityFields.js';
import { legacyEncodeEntityFields } from './shared-entity/legacyEncodeEntityFields.js';

export interface EncodeAdminEntityPayload {
  validationIssues: SaveValidationIssue[];
  type: string;
  name: string;
  fields: Record<string, unknown>;
  encodeVersion: number;
  entityIndexes: DatabaseEntityIndexesArg;
  uniqueIndexValues: UniqueIndexValueCollection;
}

export function decodePublishedEntity(
  adminSchema: AdminSchemaWithMigrations,
  values: DatabasePublishedEntityPayload,
): Result<PublishedEntity, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const publishedSchema = adminSchema.toPublishedSchema();
  const entitySpec = publishedSchema.getEntityTypeSpecification(values.type);
  if (!entitySpec) {
    return notOk.BadRequest(`No entity spec for type ${values.type} (id: ${values.id})`);
  }

  const migratedFieldValuesResult = applySchemaMigrationsToFieldValues(
    adminSchema,
    values.type,
    values.entityFields,
  );
  if (migratedFieldValuesResult.isError()) return migratedFieldValuesResult;
  const migratedFields = migratedFieldValuesResult.value;

  const decodedFields = legacyDecodeEntityFields(publishedSchema, entitySpec, migratedFields);

  const entity: PublishedEntity = {
    id: values.id,
    info: {
      type: values.type,
      name: values.name,
      authKey: values.authKey,
      createdAt: values.createdAt,
      valid: values.validPublished,
    },
    fields: decodedFields,
  };

  return ok(entity);
}

function applySchemaMigrationsToFieldValues(
  adminSchema: AdminSchemaWithMigrations,
  targetEntityType: string,
  entityFields: DatabaseEntityFieldsPayload,
): Result<Record<string, unknown>, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const actions = adminSchema.collectMigrationActionsSinceVersion(entityFields.schemaVersion);

  if (actions.length === 0) {
    return ok(entityFields.fields);
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
    entityFields.fields,
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

export function decodeAdminEntity(
  schema: AdminSchemaWithMigrations,
  values: DatabaseAdminEntityPayload,
): Result<AdminEntity, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const entitySpec = schema.getEntityTypeSpecification(values.type);
  if (!entitySpec) {
    return notOk.BadRequest(`No entity spec for type ${values.type}`);
  }

  const decodedResult = decodeAdminEntityFields(schema, entitySpec, values.entityFields);
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
  entityFields: DatabaseEntityFieldsPayload,
): Result<AdminEntity['fields'], typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const migratedFieldValuesResult = applySchemaMigrationsToFieldValues(
    schema,
    entitySpec.name,
    entityFields,
  );
  if (migratedFieldValuesResult.isError()) return migratedFieldValuesResult;
  const migratedFieldValues = migratedFieldValuesResult.value;

  const fields = legacyDecodeEntityFields(schema, entitySpec, migratedFieldValues);
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
  entityUpdate: AdminEntityUpdate,
  entityInfo: DatabaseEntityUpdateGetEntityInfoPayload,
): Result<
  { changed: boolean; entity: AdminEntity; entitySpec: AdminEntityTypeSpecification },
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const status =
    entityInfo.status === AdminEntityStatus.published
      ? AdminEntityStatus.modified
      : entityInfo.status;

  const entity: AdminEntity = {
    id: entityUpdate.id,
    info: {
      name: entityUpdate.info?.name ?? entityInfo.name,
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

  const entitySpec = schema.getEntityTypeSpecification(entity.info.type);
  if (!entitySpec) {
    return notOk.BadRequest(`Entity type ${entity.info.type} doesn’t exist`);
  }

  const migratedExistingFieldsResult = applySchemaMigrationsToFieldValues(
    schema,
    entitySpec.name,
    entityInfo.entityFields,
  );
  if (migratedExistingFieldsResult.isError()) return migratedExistingFieldsResult;
  const migratedExistingFields = migratedExistingFieldsResult.value;

  const decodedExistingFields = legacyDecodeEntityFields(
    schema,
    entitySpec,
    migratedExistingFields,
  );

  // Keep extra fields so we can fail on validation
  const normalizedUpdateFieldsResult = normalizeEntityFields(
    schema,
    ['entity'],
    { ...entityUpdate, info: { type: entity.info.type } },
    { excludeOmittedEntityFields: true, keepExtraFields: true },
  );
  if (normalizedUpdateFieldsResult.isError()) return normalizedUpdateFieldsResult;
  const normalizedUpdateFields = normalizedUpdateFieldsResult.value;

  const extraUpdateFieldNames = new Set(Object.keys(normalizedUpdateFields));

  let changed = false;
  if (entity.info.name !== entityInfo.name) {
    changed = true;
  }
  for (const fieldSpec of entitySpec.fields) {
    const fieldName = fieldSpec.name;
    const previousFieldValue = decodedExistingFields[fieldName] ?? null;

    extraUpdateFieldNames.delete(fieldName);
    if (fieldName in normalizedUpdateFields) {
      const newFieldValue = normalizedUpdateFields[fieldName];
      if (!isFieldValueEqual(previousFieldValue, newFieldValue)) {
        changed = true;
      }
      entity.fields[fieldName] = newFieldValue;
    } else {
      entity.fields[fieldName] = previousFieldValue;
    }
  }

  if (extraUpdateFieldNames.size > 0) {
    return notOk.BadRequest(
      `entity.fields: ${entitySpec.name} does not include the fields: ${[
        ...extraUpdateFieldNames,
      ].join(', ')}`,
    );
  }

  if (!changed) {
    entity.info.version = entityInfo.version;
    entity.info.status = entityInfo.status;
    entity.info.valid = entityInfo.valid;

    if (!entity.info.valid) {
      return notOk.BadRequest('No change to entity that is already invalid');
    }
  }

  return ok({ changed, entity: entity, entitySpec });
}

export async function encodeAdminEntity(
  schema: AdminSchema,
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  entitySpec: AdminEntityTypeSpecification,
  entity: AdminEntity | AdminEntityCreate,
): PromiseResult<EncodeAdminEntityPayload, typeof ErrorType.Generic> {
  // Collect values and validate entity fields
  const path = ['entity'];
  const validation = validateAdminFieldValuesAndCollectInfo(schema, path, entity);

  // TODO consider not encoding data and use it as is

  const payload: EncodeAdminEntityPayload = {
    validationIssues: validation.validationIssues,
    type: entity.info.type,
    name: entity.info.name,
    fields: legacyEncodeEntityFields(schema, entitySpec, path, entity.fields),
    encodeVersion: 0,
    entityIndexes: {
      referenceIds: [],
      locations: validation.locations,
      valueTypes: validation.valueTypes,
      fullTextSearchText: validation.fullTextSearchText,
    },
    uniqueIndexValues: validation.uniqueIndexValues,
  };

  // Validate and resolve references
  const referencesResult = await validateReferencedEntitiesForSaveAndCollectInfo(
    databaseAdapter,
    context,
    validation.references,
  );
  if (referencesResult.isError()) return referencesResult;
  payload.validationIssues.push(...referencesResult.value.validationIssues);
  payload.entityIndexes.referenceIds.push(...referencesResult.value.references);

  return ok(payload);
}

export const forTest = {
  applySchemaMigrationsToFieldValues,
};
