import {
  EntityStatus,
  ErrorType,
  notOk,
  ok,
  validateEntityInfo,
  type EntityProcessDirtyPayload,
  type SchemaWithMigrations,
  type EntityReference,
  type ErrorResult,
  type PromiseResult,
  type Result,
} from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabaseAdminEntityPayload,
  DatabaseEntityFieldsPayload,
  DatabaseEntityIndexesArg,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { decodeAdminEntity } from '../EntityCodec.js';
import type { UniqueIndexValueCollection } from '../EntityCollectors.js';
import {
  validateAdminFieldValuesAndCollectInfo,
  validatePublishedFieldValuesAndCollectInfo,
  validateReferencedEntitiesArePublishedAndCollectInfo,
  validateReferencedEntitiesForSaveAndCollectInfo,
} from '../EntityValidator.js';
import { updateUniqueIndexesForEntity } from '../admin-entity/updateUniqueIndexesForEntity.js';
import { migrateDecodeAndNormalizeAdminEntityFields } from '../shared-entity/migrateDecodeAndNormalizeEntityFields.js';
import { assertIsDefined } from '../utils/AssertUtils.js';

interface EntityValidity {
  validAdmin: boolean;
  validPublished: boolean | null;
}

interface EntityValidityAndInfoPayload {
  valid: boolean;
  entityIndexes: DatabaseEntityIndexesArg;
  uniqueIndexValues: UniqueIndexValueCollection;
}

const EMPTY_ENTITY_INFO: Omit<EntityValidityAndInfoPayload, 'valid'> = {
  entityIndexes: { fullTextSearchText: '', locations: [], referenceIds: [], componentTypes: [] },
  uniqueIndexValues: new Map(),
};

export async function managementDirtyProcessNextEntity(
  schema: SchemaWithMigrations,
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  filter: EntityReference | undefined,
): PromiseResult<EntityProcessDirtyPayload | null, typeof ErrorType.Generic> {
  return context.withTransaction(async (context) => {
    // Fetch info about next dirty entity
    const entityResult = await databaseAdapter.managementDirtyGetNextEntity(context, filter);
    if (entityResult.isError()) {
      if (entityResult.error === ErrorType.NotFound) {
        return ok(null); // no more dirty entities
      }
      return notOk.Generic(entityResult.message); //cast Generic -> Generic
    }

    //
    const reference = { id: entityResult.value.id };
    const resolvedReference = { entityInternalId: entityResult.value.entityInternalId };
    const {
      dirtyValidateLatest,
      dirtyValidatePublished,
      dirtyIndexLatest,
      dirtyIndexPublished,
      status,
    } = entityResult.value;
    const entityIsPublished = status === EntityStatus.published || status === EntityStatus.modified;

    // Reuse existing validation results if we won't be validating
    const entityValidity: EntityValidity = {
      validAdmin: entityResult.value.valid,
      validPublished: entityResult.value.validPublished,
    };

    // Unique index values are updated separately, so keep them for later
    let latestUniqueIndexValues: UniqueIndexValueCollection | null = null;
    let publishedUniqueIndexValues: UniqueIndexValueCollection | null = null;

    // Validate / index latest
    if (dirtyValidateLatest || dirtyIndexLatest) {
      // Validate latest
      const validationLatestResult = await validateAndCollectInfoFromAdminEntity(
        schema,
        databaseAdapter,
        context,
        entityResult.value,
      );
      if (validationLatestResult.isError()) return validationLatestResult;
      entityValidity.validAdmin = validationLatestResult.value.valid;
      latestUniqueIndexValues = validationLatestResult.value.uniqueIndexValues;

      // Index latest
      if (dirtyIndexLatest) {
        const updateLatestResult = await databaseAdapter.adminEntityIndexesUpdateLatest(
          context,
          entityResult.value,
          validationLatestResult.value.entityIndexes,
          false,
        );
        if (updateLatestResult.isError()) return updateLatestResult;
      }
    }

    // Validate / index published
    if ((dirtyValidatePublished || dirtyIndexPublished) && entityIsPublished) {
      // Fetch the correct version of the entity since when modified we got the wrong version
      let entityFields = entityResult.value.entityFields;
      if (status === EntityStatus.modified) {
        const getPublishedEntityResult = await databaseAdapter.publishedEntityGetOne(
          context,
          reference,
        );
        if (getPublishedEntityResult.isError()) {
          return notOk.Generic(getPublishedEntityResult.message); // convert NotFound to Generic
        }
        entityFields = getPublishedEntityResult.value.entityFields;
      }

      // Validate published
      const validationPublishedResult = await validateAndCollectInfoFromPublishedEntity(
        schema,
        databaseAdapter,
        context,
        reference,
        entityResult.value.type,
        entityFields,
      );
      if (validationPublishedResult.isError()) return validationPublishedResult;
      entityValidity.validPublished = validationPublishedResult.value.valid;
      publishedUniqueIndexValues = validationPublishedResult.value.uniqueIndexValues;

      // Index published
      if (dirtyIndexPublished) {
        const updatePublishedResult = await databaseAdapter.adminEntityIndexesUpdatePublished(
          context,
          entityResult.value,
          validationPublishedResult.value.entityIndexes,
        );
        if (updatePublishedResult.isError()) return updatePublishedResult;
      }
    }

    // Update unique indexes (even since validating/indexing is normally the same amount of work)
    const uniqueIndexValuesResult = await validateAndUpdateUniqueIndexValues(
      databaseAdapter,
      context,
      resolvedReference,
      latestUniqueIndexValues,
      publishedUniqueIndexValues,
      entityValidity,
    );
    if (uniqueIndexValuesResult.isError()) return uniqueIndexValuesResult;

    // Update entity, reset dirty flags
    const updateResult = await databaseAdapter.managementDirtyUpdateEntity(
      context,
      entityResult.value,
      entityValidity.validAdmin,
      entityValidity.validPublished,
    );
    if (updateResult.isError()) return updateResult;

    return ok({
      id: entityResult.value.id,
      valid: entityValidity.validAdmin,
      validPublished: entityValidity.validPublished,
      previousValid: entityResult.value.valid,
      previousValidPublished: entityResult.value.validPublished,
    });
  });
}

async function validateAndCollectInfoFromAdminEntity(
  schema: SchemaWithMigrations,
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  entityData: DatabaseAdminEntityPayload,
): PromiseResult<EntityValidityAndInfoPayload, typeof ErrorType.Generic> {
  const path = ['entity'];

  // Decode
  const decodeResult = decodeAdminEntity(schema, entityData);
  if (decodeResult.isError()) {
    return convertErrorResultForValidation(
      context,
      entityData,
      'Failed decoding entity',
      decodeResult,
    );
  }
  const entity = decodeResult.value;

  // Validate entity info
  const validEntityInfo = !validateEntityInfo(schema, path, entity);

  // Validate fields
  const fieldValidation = validateAdminFieldValuesAndCollectInfo(schema, path, entity);

  // Validate references
  const referencesResult = await validateReferencedEntitiesForSaveAndCollectInfo(
    databaseAdapter,
    context,
    fieldValidation.references,
  );
  if (referencesResult.isError()) return referencesResult;

  return ok({
    valid:
      validEntityInfo &&
      fieldValidation.validationIssues.length === 0 &&
      referencesResult.value.validationIssues.length === 0,
    entityIndexes: {
      referenceIds: referencesResult.value.references,
      locations: fieldValidation.locations,
      componentTypes: fieldValidation.componentTypes,
      fullTextSearchText: fieldValidation.fullTextSearchText,
    },
    uniqueIndexValues: fieldValidation.uniqueIndexValues,
  });
}

async function validateAndCollectInfoFromPublishedEntity(
  schema: SchemaWithMigrations,
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  reference: EntityReference,
  type: string,
  entityFields: DatabaseEntityFieldsPayload,
): PromiseResult<EntityValidityAndInfoPayload, typeof ErrorType.Generic> {
  const path = ['entity'];

  const entitySpec = schema.getEntityTypeSpecification(type);
  if (!entitySpec) {
    return convertErrorResultForValidation(
      context,
      reference,
      'Failed fetching entity spec',
      notOk.BadRequest(`No entity spec for type ${type}`),
    );
  }

  if (!entitySpec.publishable) {
    return convertErrorResultForValidation(
      context,
      reference,
      'Entity type is not publishable',
      notOk.BadRequest(`Entity type ${type} is not publishable`),
    );
  }

  // In order to validate the published entity we need the admin entity fields
  const decodeResult = migrateDecodeAndNormalizeAdminEntityFields(
    schema,
    entitySpec,
    [...path, 'fields'],
    entityFields,
  );
  if (decodeResult.isError()) {
    return convertErrorResultForValidation(
      context,
      reference,
      'Failed decoding entity fields',
      decodeResult,
    );
  }
  const decodedEntityFields = decodeResult.value;

  const validateFields = validatePublishedFieldValuesAndCollectInfo(
    schema,
    path,
    type,
    decodedEntityFields,
  );

  const validateReferencedEntitiesResult =
    await validateReferencedEntitiesArePublishedAndCollectInfo(databaseAdapter, context, [
      { entity: reference, references: validateFields.references },
    ]);
  if (validateReferencedEntitiesResult.isError()) {
    return convertErrorResultForValidation(
      context,
      reference,
      'Failed validating referenced entities',
      validateReferencedEntitiesResult,
    );
  }
  const referenceIds = validateReferencedEntitiesResult.value.validReferences.get(reference.id);
  assertIsDefined(referenceIds);

  return ok({
    valid:
      validateFields.validationIssues.length === 0 &&
      validateReferencedEntitiesResult.value.invalidReferences.size === 0 &&
      validateReferencedEntitiesResult.value.unpublishedReferences.size === 0,
    entityIndexes: {
      fullTextSearchText: validateFields.fullTextSearchText,
      locations: validateFields.locations,
      componentTypes: validateFields.componentTypes,
      referenceIds,
    },
    uniqueIndexValues: validateFields.uniqueIndexValues,
  });
}

function convertErrorResultForValidation(
  context: TransactionContext,
  reference: EntityReference,
  logMessage: string,
  result: ErrorResult<undefined, typeof ErrorType.BadRequest | typeof ErrorType.Generic>,
): Result<EntityValidityAndInfoPayload, typeof ErrorType.Generic> {
  if (result.isErrorType(ErrorType.BadRequest)) {
    context.logger.error('entity(%s): %s: %s', reference.id, logMessage, result.message);
    return ok({ valid: false, ...EMPTY_ENTITY_INFO });
  }
  return notOk.Generic(result.message); // cast Generic -> Generic
}

async function validateAndUpdateUniqueIndexValues(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  reference: DatabaseResolvedEntityReference,
  latestUniqueIndexValues: UniqueIndexValueCollection | null,
  publishedUniqueIndexValues: UniqueIndexValueCollection | null,
  entityValidity: EntityValidity,
): PromiseResult<void, typeof ErrorType.Generic> {
  if (latestUniqueIndexValues === null && publishedUniqueIndexValues === null) {
    return ok(undefined);
  }

  const bothResult = await updateUniqueIndexesForEntity(
    databaseAdapter,
    context,
    reference,
    false,
    latestUniqueIndexValues,
    publishedUniqueIndexValues,
  );
  if (bothResult.isError()) return bothResult;

  for (const { latest, published } of bothResult.value.conflictingValues) {
    if (latest) {
      entityValidity.validAdmin = false;
    }
    if (published) {
      entityValidity.validPublished = false;
    }
  }

  return ok(undefined);
}
