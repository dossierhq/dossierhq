import {
  AdminEntityStatus,
  ErrorType,
  assertIsDefined,
  copyEntity,
  normalizeEntityFields,
  notOk,
  ok,
  validateEntityInfo,
  type AdminSchemaWithMigrations,
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
import { decodeAdminEntity, encodeAdminEntity } from '../EntityCodec.js';
import type { UniqueIndexValueCollection } from '../EntityCollectors.js';
import {
  validatePublishedFieldValuesAndCollectInfo,
  validateReferencedEntitiesArePublishedAndCollectInfo,
} from '../EntityValidator.js';
import { updateUniqueIndexesForEntity } from '../admin-entity/updateUniqueIndexesForEntity.js';
import { migrateAndDecodeAdminEntityFields } from '../shared-entity/migrateAndDecodeEntityFields.js';

export interface ProcessDirtyEntityPayload {
  id: string;
  valid: boolean;
  validPublished: boolean | null;
  previousValid: boolean;
  previousValidPublished: boolean | null;
}

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
  entityIndexes: { fullTextSearchText: '', locations: [], referenceIds: [], valueTypes: [] },
  uniqueIndexValues: new Map(),
};

export async function managementDirtyProcessNextEntity(
  adminSchema: AdminSchemaWithMigrations,
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  filter: EntityReference | undefined,
): PromiseResult<ProcessDirtyEntityPayload | null, typeof ErrorType.Generic> {
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
    const entityIsPublished =
      status === AdminEntityStatus.published || status === AdminEntityStatus.modified;

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
        adminSchema,
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
      if (status === AdminEntityStatus.modified) {
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
        adminSchema,
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
  adminSchema: AdminSchemaWithMigrations,
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  entityData: DatabaseAdminEntityPayload,
): PromiseResult<EntityValidityAndInfoPayload, typeof ErrorType.Generic> {
  const decodeResult = decodeAdminEntity(adminSchema, entityData);
  if (decodeResult.isError()) {
    return convertErrorResultForValidation(
      context,
      entityData,
      'Failed decoding entity',
      decodeResult,
    );
  }
  const entity = decodeResult.value;

  const validationIssue = validateEntityInfo(adminSchema, [], entity);
  const validEntityInfo = !validationIssue;

  const entitySpec = adminSchema.getEntityTypeSpecification(entity.info.type);
  if (!entitySpec) {
    return convertErrorResultForValidation(
      context,
      entity,
      'Failed fetching entity spec',
      notOk.BadRequest(`No entity spec for type ${entity.info.type}`),
    );
  }

  const normalizedResult = normalizeEntityFields(adminSchema, ['entity'], entity);
  if (normalizedResult.isError()) {
    return convertErrorResultForValidation(
      context,
      entity,
      'Failed normalizing entity',
      normalizedResult,
    );
  }
  const normalizedEntity = copyEntity(entity, { fields: normalizedResult.value });

  // TODO a bit unnecessary to encode when not updating indexes since we don't use the result, but it is running all validations
  // could refactor it when all validations are moved to validateAdminFieldValuesAndCollectInfo()
  const encodeResult = await encodeAdminEntity(
    adminSchema,
    databaseAdapter,
    context,
    entitySpec,
    normalizedEntity,
  );
  if (encodeResult.isError()) {
    return convertErrorResultForValidation(context, entity, 'Failed encoding entity', encodeResult);
  }

  return ok({
    valid: validEntityInfo && encodeResult.value.validationIssues.length === 0,
    entityIndexes: encodeResult.value.entityIndexes,
    uniqueIndexValues: encodeResult.value.uniqueIndexValues,
  });
}

async function validateAndCollectInfoFromPublishedEntity(
  adminSchema: AdminSchemaWithMigrations,
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  reference: EntityReference,
  type: string,
  entityFields: DatabaseEntityFieldsPayload,
): PromiseResult<EntityValidityAndInfoPayload, typeof ErrorType.Generic> {
  const publishedSchema = adminSchema.toPublishedSchema();
  const entitySpec = adminSchema.getEntityTypeSpecification(type);
  if (!entitySpec) {
    return convertErrorResultForValidation(
      context,
      reference,
      'Failed fetching entity spec',
      notOk.BadRequest(`No entity spec for type ${type}`),
    );
  }

  if (entitySpec.adminOnly) {
    return convertErrorResultForValidation(
      context,
      reference,
      'Entity type is admin only',
      notOk.BadRequest(`Entity type ${type} is admin only`),
    );
  }

  // In order to validate the published entity we need the admin entity fields
  const decodeResult = migrateAndDecodeAdminEntityFields(adminSchema, entitySpec, entityFields);
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
    adminSchema,
    publishedSchema,
    ['entity'],
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
      valueTypes: validateFields.valueTypes,
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
