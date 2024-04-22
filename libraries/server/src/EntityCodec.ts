import {
  EntityStatus,
  isFieldValueEqual,
  normalizeEntityFields,
  notOk,
  ok,
  type Entity,
  type EntityCreate,
  type EntityUpdate,
  type Schema,
  type SchemaWithMigrations,
  type ErrorType,
  type PromiseResult,
  type PublishedEntity,
  type Result,
  type SaveValidationIssue,
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
import {
  validateAdminFieldValuesAndCollectInfo,
  validateReferencedEntitiesForSaveAndCollectInfo,
} from './EntityValidator.js';
import { encodeEntityFields } from './shared-entity/encodeEntityFields.js';
import {
  migrateDecodeAndNormalizePublishedEntityFields,
  migrateDecodeAndNormalizeAdminEntityFields,
} from './shared-entity/migrateDecodeAndNormalizeEntityFields.js';

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
  schema: SchemaWithMigrations,
  values: DatabasePublishedEntityPayload,
): Result<PublishedEntity, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const publishedSchema = schema.toPublishedSchema();
  const entitySpec = publishedSchema.getEntityTypeSpecification(values.type);
  if (!entitySpec) {
    return notOk.BadRequest(`No entity spec for type ${values.type} (id: ${values.id})`);
  }

  const decodeResult = migrateDecodeAndNormalizePublishedEntityFields(
    schema,
    entitySpec,
    ['entity', 'fields'],
    values.entityFields,
  );
  if (decodeResult.isError()) return decodeResult;

  const entity: PublishedEntity = {
    id: values.id,
    info: {
      type: values.type,
      name: values.name,
      authKey: values.authKey,
      createdAt: values.createdAt,
      valid: values.validPublished,
    },
    fields: decodeResult.value,
  };

  return ok(entity);
}

export function decodeAdminEntity(
  schema: SchemaWithMigrations,
  values: DatabaseAdminEntityPayload,
): Result<Entity, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const entitySpec = schema.getEntityTypeSpecification(values.type);
  if (!entitySpec) {
    return notOk.BadRequest(`No entity spec for type ${values.type}`);
  }

  const decodedResult = migrateDecodeAndNormalizeAdminEntityFields(
    schema,
    entitySpec,
    ['entity', 'fields'],
    values.entityFields,
  );
  if (decodedResult.isError()) return decodedResult;
  const fields = decodedResult.value;

  const entity: Entity = {
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

export function resolveCreateEntity(
  schema: Schema,
  entity: EntityCreate,
): Result<{ createEntity: EntityCreate }, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const payload: EntityCreate = {
    info: {
      name: entity.info.name,
      type: entity.info.type,
      version: 1,
      authKey: entity.info.authKey,
    },
    fields: {},
  };

  // Keep extra fields so we can fail on validation
  const normalizedResult = normalizeEntityFields(schema, ['entity'], entity, {
    keepExtraFields: true,
  });
  if (normalizedResult.isError()) return normalizedResult;
  payload.fields = normalizedResult.value;

  return ok({ createEntity: payload });
}

export function resolveUpdateEntity(
  schema: SchemaWithMigrations,
  entityUpdate: EntityUpdate,
  entityInfo: DatabaseEntityUpdateGetEntityInfoPayload,
): Result<
  { changed: boolean; entity: Entity },
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const status =
    entityInfo.status === EntityStatus.published ? EntityStatus.modified : entityInfo.status;

  const entity: Entity = {
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

  const decodeResult = migrateDecodeAndNormalizeAdminEntityFields(
    schema,
    entitySpec,
    ['entity', 'fields'],
    entityInfo.entityFields,
  );
  if (decodeResult.isError()) return decodeResult;
  const decodedExistingFields = decodeResult.value;

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

  return ok({ changed, entity });
}

export async function encodeAdminEntity(
  schema: Schema,
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  entity: Entity | EntityCreate,
): PromiseResult<EncodeAdminEntityPayload, typeof ErrorType.Generic> {
  // Collect values and validate entity fields
  const path = ['entity'];
  const validation = validateAdminFieldValuesAndCollectInfo(schema, path, entity);

  const encodedPayload = encodeEntityFields(entity.fields);

  const payload: EncodeAdminEntityPayload = {
    ...encodedPayload,
    validationIssues: validation.validationIssues,
    type: entity.info.type,
    name: entity.info.name,
    entityIndexes: {
      referenceIds: [],
      locations: validation.locations,
      componentTypes: validation.componentTypes,
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
