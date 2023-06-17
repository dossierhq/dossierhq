import {
  AdminEntityStatus,
  ErrorType,
  assertIsDefined,
  copyEntity,
  normalizeEntityFields,
  notOk,
  ok,
  validateEntityInfo,
  type AdminSchema,
  type EntityReference,
  type PromiseResult,
} from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabaseAdminEntityPayload,
  DatabaseEntityIndexesArg,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { decodeAdminEntity, decodeAdminEntityFields, encodeAdminEntity } from '../EntityCodec.js';
import type { UniqueIndexValueCollection } from '../EntityCollectors.js';
import {
  validatePublishedFieldValuesAndCollectInfo,
  validateReferencedEntitiesArePublishedAndCollectInfo,
} from '../EntityValidator.js';
import { updateUniqueIndexesForEntity } from '../admin-entity/updateUniqueIndexesForEntity.js';

export async function managementDirtyProcessNextEntity(
  adminSchema: AdminSchema,
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext
): PromiseResult<{ id: string; valid: boolean } | null, typeof ErrorType.Generic> {
  return context.withTransaction(async (context) => {
    // Fetch info about next dirty entity
    const entityResult = await databaseAdapter.managementDirtyGetNextEntity(context);
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
    let validAdmin = entityResult.value.valid;
    let validPublished = validAdmin; // TODO get from db

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
        entityResult.value
      );
      if (validationLatestResult.isOk()) {
        validAdmin = true;
        latestUniqueIndexValues = validationLatestResult.value.uniqueIndexValues;
      } else {
        if (validationLatestResult.isErrorType(ErrorType.BadRequest)) {
          validAdmin = false;
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
          false
        );
        if (updateLatestResult.isError()) return updateLatestResult;
      }
    }

    // Validate / index published
    if ((dirtyValidatePublished || dirtyIndexPublished) && entityIsPublished) {
      // Fetch the correct version of the entity since when modified we got the wrong version
      let fieldValues = entityResult.value.fieldValues;
      if (status === AdminEntityStatus.modified) {
        const getPublishedEntityResult = await databaseAdapter.publishedEntityGetOne(
          context,
          reference
        );
        if (getPublishedEntityResult.isError()) {
          return notOk.Generic(getPublishedEntityResult.message); // convert NotFound to Generic
        }
        fieldValues = getPublishedEntityResult.value.fieldValues;
      }

      // Validate published
      const validationPublishedResult = await validatePublishedEntity(
        adminSchema,
        databaseAdapter,
        context,
        reference,
        entityResult.value.type,
        fieldValues
      );
      if (validationPublishedResult.isOk()) {
        validPublished = true;
        publishedUniqueIndexValues = validationPublishedResult.value.uniqueIndexValues;
      } else {
        if (validationPublishedResult.error === ErrorType.BadRequest) {
          validPublished = false;
        } else {
          return notOk.Generic(validationPublishedResult.message);
        }
      }

      // Index published
      if (dirtyIndexPublished && validationPublishedResult.isOk()) {
        const updatePublishedResult = await databaseAdapter.adminEntityIndexesUpdatePublished(
          context,
          entityResult.value,
          validationPublishedResult.value.entityIndexes
        );
        if (updatePublishedResult.isError()) return updatePublishedResult;
      }
    }

    // Update unique indexes (even since validating/indexing is normally the same amount of work)
    if (latestUniqueIndexValues !== null || publishedUniqueIndexValues !== null) {
      const uniqueValuesUpdateResult = await updateUniqueIndexesForEntity(
        databaseAdapter,
        context,
        resolvedReference,
        false,
        latestUniqueIndexValues,
        publishedUniqueIndexValues
      );
      if (uniqueValuesUpdateResult.isError()) {
        if (uniqueValuesUpdateResult.isErrorType(ErrorType.BadRequest)) {
          if (latestUniqueIndexValues !== null) {
            validAdmin = false;
          }
          if (publishedUniqueIndexValues !== null && latestUniqueIndexValues === null) {
            validPublished = false;
          } else if (publishedUniqueIndexValues !== null && latestUniqueIndexValues !== null) {
            const uniqueValuesPublishedUpdateResult = await updateUniqueIndexesForEntity(
              databaseAdapter,
              context,
              resolvedReference,
              false,
              null,
              publishedUniqueIndexValues
            );
            if (uniqueValuesPublishedUpdateResult.isError()) {
              if (uniqueValuesPublishedUpdateResult.isErrorType(ErrorType.BadRequest)) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                validPublished = false;
              } else {
                return notOk.Generic(uniqueValuesPublishedUpdateResult.message);
              }
            }
          }
        } else {
          return notOk.Generic(uniqueValuesUpdateResult.message);
        }
      }
    }

    // Update entity, reset dirty flags
    const updateResult = await databaseAdapter.managementDirtyUpdateEntity(
      context,
      entityResult.value,
      validAdmin
    );
    if (updateResult.isError()) return updateResult;

    return ok({ id: entityResult.value.id, valid: validAdmin });
  });
}

async function validateAdminEntity(
  adminSchema: AdminSchema,
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  entityData: DatabaseAdminEntityPayload
): PromiseResult<
  { entityIndexes: DatabaseEntityIndexesArg; uniqueIndexValues: UniqueIndexValueCollection },
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const entity = decodeAdminEntity(adminSchema, entityData);
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
    normalizedEntity
  );
  if (encodeResult.isError()) return encodeResult;

  return ok({
    entityIndexes: encodeResult.value.entityIndexes,
    uniqueIndexValues: encodeResult.value.uniqueIndexValues,
  });
}

async function validatePublishedEntity(
  adminSchema: AdminSchema,
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  reference: EntityReference,
  type: string,
  fieldValues: Record<string, unknown>
): PromiseResult<
  { entityIndexes: DatabaseEntityIndexesArg; uniqueIndexValues: UniqueIndexValueCollection },
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const entitySpec = adminSchema.getEntityTypeSpecification(type);
  if (!entitySpec) return notOk.Generic(`No entity spec for type ${type}`);

  if (entitySpec.adminOnly) return notOk.Generic(`Entity type is admin only`);

  const entityFields = decodeAdminEntityFields(adminSchema, entitySpec, fieldValues);

  const validateFieldsResult = validatePublishedFieldValuesAndCollectInfo(
    adminSchema,
    adminSchema.toPublishedSchema(),
    ['entity'],
    type,
    entityFields
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
