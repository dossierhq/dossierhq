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
  type PromiseResult,
} from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabaseAdminEntityPayload,
  DatabaseEntityIndexesArg,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { decodeAdminEntity, decodeAdminEntityFields, encodeAdminEntity } from '../EntityCodec.js';
import type { UniqueIndexValueCollection } from '../EntityCollectors.js';
import {
  validatePublishedFieldValuesAndCollectInfo,
  validateReferencedEntitiesArePublishedAndCollectInfo,
} from '../EntityValidator.js';
import { updateUniqueIndexesForEntity } from '../admin-entity/updateUniqueIndexesForEntity.js';

interface EntityValidity {
  validAdmin: boolean;
  validPublished: boolean | null;
}

export async function managementDirtyProcessNextEntity(
  adminSchema: AdminSchemaWithMigrations,
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  filter: EntityReference | undefined,
): PromiseResult<
  { id: string; valid: boolean; validPublished: boolean | null } | null,
  typeof ErrorType.Generic
> {
  return context.withTransaction(async (context) => {
    // Fetch info about next dirty entity
    const entityResult = await databaseAdapter.managementDirtyGetNextEntity(context, filter);
    if (entityResult.isError()) {
      if (entityResult.error === ErrorType.NotFound) {
        return ok(null); // no more dirty entities
      } else {
        return notOk.Generic(entityResult.message);
      }
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
      const validationLatestResult = await validateAdminEntity(
        adminSchema,
        databaseAdapter,
        context,
        entityResult.value,
      );
      if (validationLatestResult.isOk()) {
        entityValidity.validAdmin = true;
        latestUniqueIndexValues = validationLatestResult.value.uniqueIndexValues;
      } else {
        if (validationLatestResult.isErrorType(ErrorType.BadRequest)) {
          entityValidity.validAdmin = false;
        } else {
          return notOk.Generic(validationLatestResult.message);
        }
      }

      // Index latest
      if (dirtyIndexLatest && validationLatestResult.isOk()) {
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
      let schemaVersion = entityResult.value.schemaVersion;
      let fieldValues = entityResult.value.fieldValues;
      if (status === AdminEntityStatus.modified) {
        const getPublishedEntityResult = await databaseAdapter.publishedEntityGetOne(
          context,
          reference,
        );
        if (getPublishedEntityResult.isError()) {
          return notOk.Generic(getPublishedEntityResult.message); // convert NotFound to Generic
        }
        schemaVersion = getPublishedEntityResult.value.schemaVersion;
        fieldValues = getPublishedEntityResult.value.fieldValues;
      }

      // Validate published
      const validationPublishedResult = await validatePublishedEntity(
        adminSchema,
        databaseAdapter,
        context,
        reference,
        entityResult.value.type,
        schemaVersion,
        fieldValues,
      );
      if (validationPublishedResult.isOk()) {
        entityValidity.validPublished = true;
        publishedUniqueIndexValues = validationPublishedResult.value.uniqueIndexValues;
      } else {
        if (validationPublishedResult.error === ErrorType.BadRequest) {
          entityValidity.validPublished = false;
        } else {
          return notOk.Generic(validationPublishedResult.message);
        }
      }

      // Index published
      if (dirtyIndexPublished && validationPublishedResult.isOk()) {
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
    });
  });
}

async function validateAdminEntity(
  adminSchema: AdminSchemaWithMigrations,
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  entityData: DatabaseAdminEntityPayload,
): PromiseResult<
  { entityIndexes: DatabaseEntityIndexesArg; uniqueIndexValues: UniqueIndexValueCollection },
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const entityResult = decodeAdminEntity(adminSchema, entityData);
  if (entityResult.isError()) return entityResult;
  const entity = entityResult.value;

  const validationIssue = validateEntityInfo(adminSchema, [], entity);
  if (validationIssue) return notOk.BadRequest('Invalid entity info');

  const entitySpec = adminSchema.getEntityTypeSpecification(entity.info.type);
  if (!entitySpec) return notOk.BadRequest('Invalid entity type');

  const normalizedResult = normalizeEntityFields(adminSchema, entity);
  if (normalizedResult.isError()) return normalizedResult;
  const normalizedEntity = copyEntity(entity, { fields: normalizedResult.value });

  // TODO a bit unnecessary to encode when not updating indexes since we don't use the result, but it is running all validations
  const encodeResult = await encodeAdminEntity(
    adminSchema,
    databaseAdapter,
    context,
    entitySpec,
    normalizedEntity,
  );
  if (encodeResult.isError()) return encodeResult;

  return ok({
    entityIndexes: encodeResult.value.entityIndexes,
    uniqueIndexValues: encodeResult.value.uniqueIndexValues,
  });
}

async function validatePublishedEntity(
  adminSchema: AdminSchemaWithMigrations,
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  reference: EntityReference,
  type: string,
  schemaVersion: number,
  fieldValues: Record<string, unknown>,
): PromiseResult<
  { entityIndexes: DatabaseEntityIndexesArg; uniqueIndexValues: UniqueIndexValueCollection },
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const entitySpec = adminSchema.getEntityTypeSpecification(type);
  if (!entitySpec) return notOk.Generic(`No entity spec for type ${type}`);

  if (entitySpec.adminOnly) return notOk.Generic(`Entity type is admin only`);

  const decodeResult = decodeAdminEntityFields(adminSchema, entitySpec, schemaVersion, fieldValues);
  if (decodeResult.isError()) return decodeResult;
  const entityFields = decodeResult.value;

  const validateFieldsResult = validatePublishedFieldValuesAndCollectInfo(
    adminSchema,
    adminSchema.toPublishedSchema(),
    ['entity'],
    type,
    entityFields,
  );
  if (validateFieldsResult.isError()) return validateFieldsResult;

  const validateReferencedEntitiesResult =
    await validateReferencedEntitiesArePublishedAndCollectInfo(databaseAdapter, context, [
      { entity: reference, references: validateFieldsResult.value.references },
    ]);
  if (validateReferencedEntitiesResult.isError()) return validateReferencedEntitiesResult;
  const referenceIds = validateReferencedEntitiesResult.value.get(reference.id);
  assertIsDefined(referenceIds);

  return ok({
    entityIndexes: {
      fullTextSearchText: validateFieldsResult.value.fullTextSearchText,
      locations: validateFieldsResult.value.locations,
      valueTypes: validateFieldsResult.value.valueTypes,
      referenceIds,
    },
    uniqueIndexValues: validateFieldsResult.value.uniqueIndexValues,
  });
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
  if (bothResult.isOk()) return ok(undefined);
  if (bothResult.isErrorType(ErrorType.Generic)) return bothResult;

  // If only one of (latest|published) is non-null, we know where the problem is
  if (latestUniqueIndexValues !== null && publishedUniqueIndexValues === null) {
    entityValidity.validAdmin = false;
  } else if (latestUniqueIndexValues === null && publishedUniqueIndexValues !== null) {
    entityValidity.validPublished = false;
  } else if (latestUniqueIndexValues !== null && publishedUniqueIndexValues !== null) {
    // Since it failed when updating both, we don't know where the problem is
    // Try updating only latest, then only published, to see if we can find out

    // Check latest only
    const latestResult = await updateUniqueIndexesForEntity(
      databaseAdapter,
      context,
      reference,
      false,
      latestUniqueIndexValues,
      null, // skip publishedUniqueIndexValues
    );
    if (latestResult.isError()) {
      if (latestResult.isErrorType(ErrorType.BadRequest)) {
        entityValidity.validAdmin = false;
      } else {
        return notOk.Generic(latestResult.message);
      }
    }

    // Check published only
    const publishedResult = await updateUniqueIndexesForEntity(
      databaseAdapter,
      context,
      reference,
      false,
      null, // skip latestUniqueIndexValues
      publishedUniqueIndexValues,
    );
    if (publishedResult.isError()) {
      if (publishedResult.isErrorType(ErrorType.BadRequest)) {
        entityValidity.validPublished = false;
      } else {
        return notOk.Generic(publishedResult.message);
      }
    }
  }
  return ok(undefined);
}
