import {
  AdminEntityStatus,
  ErrorType,
  assertIsDefined,
  copyEntity,
  normalizeEntityFields,
  notOk,
  ok,
  validateEntityInfo,
  type AdminEntity,
  type AdminSchema,
  type EntityReference,
  type PromiseResult,
} from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabaseEntityIndexesArg,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { decodeAdminEntity, decodeAdminEntityFields, encodeAdminEntity } from '../EntityCodec.js';
import {
  ensureReferencedEntitiesArePublishedAndCollectInfo,
  verifyFieldValuesAndCollectInformation,
} from '../admin-entity/adminPublishEntities.js';

export async function managementDirtyProcessNextEntity(
  adminSchema: AdminSchema,
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext
): PromiseResult<{ id: string; valid: boolean } | null, typeof ErrorType.Generic> {
  return context.withTransaction(async (context) => {
    const entityResult = await databaseAdapter.managementDirtyGetNextEntity(context);
    if (entityResult.isError()) {
      if (entityResult.error === ErrorType.NotFound) {
        return ok(null);
      } else {
        return notOk.Generic(entityResult.message);
      }
    }

    const reference = { id: entityResult.value.id };
    const {
      dirtyValidateLatest,
      dirtyValidatePublished: _todo1,
      dirtyIndexLatest,
      dirtyIndexPublished,
    } = entityResult.value;
    let valid = entityResult.value.valid;

    if (dirtyValidateLatest || dirtyIndexLatest) {
      const entity = decodeAdminEntity(adminSchema, entityResult.value);
      const validationResult = await validateAdminEntity(
        adminSchema,
        databaseAdapter,
        context,
        entity
      );
      if (validationResult.isError() && validationResult.isErrorType(ErrorType.Generic)) {
        return validationResult;
      }

      valid = validationResult.isOk();

      if (dirtyIndexLatest && validationResult.isOk()) {
        const updateLatestResult = await databaseAdapter.adminEntityIndexesUpdateLatest(
          context,
          entityResult.value,
          validationResult.value,
          false
        );
        if (updateLatestResult.isError()) return updateLatestResult;
      }
    }

    if (
      dirtyIndexPublished &&
      ([AdminEntityStatus.published, AdminEntityStatus.modified] as string[]).includes(
        entityResult.value.status
      )
    ) {
      let fieldValues = entityResult.value.fieldValues;
      if (entityResult.value.status === AdminEntityStatus.modified) {
        // Fetch the correct version since it's not the latest version that's published
        const publishedEntityResult = await databaseAdapter.publishedEntityGetOne(
          context,
          reference
        );
        if (publishedEntityResult.isError()) {
          return notOk.Generic(publishedEntityResult.message); // convert NotFound to Generic
        }
        fieldValues = publishedEntityResult.value.fieldValues;
      }
      const validationResult = await validatePublishedEntity(
        adminSchema,
        databaseAdapter,
        context,
        reference,
        entityResult.value.type,
        fieldValues
      );
      if (validationResult.isError() && validationResult.isErrorType(ErrorType.Generic)) {
        return validationResult;
      }

      if (dirtyIndexPublished && validationResult.isOk()) {
        const updatePublishedResult = await databaseAdapter.adminEntityIndexesUpdatePublished(
          context,
          entityResult.value,
          validationResult.value
        );
        if (updatePublishedResult.isError()) return updatePublishedResult;
      }
    }

    const updateResult = await databaseAdapter.managementDirtyUpdateEntity(
      context,
      entityResult.value,
      valid
    );
    if (updateResult.isError()) return updateResult;

    return ok({ id: entityResult.value.id, valid });
  });
}

async function validateAdminEntity(
  adminSchema: AdminSchema,
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  entity: AdminEntity
): PromiseResult<DatabaseEntityIndexesArg, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
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

  return ok(encodeResult.value.entityIndexes);
}

async function validatePublishedEntity(
  adminSchema: AdminSchema,
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  reference: EntityReference,
  type: string,
  fieldValues: Record<string, unknown>
): PromiseResult<DatabaseEntityIndexesArg, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const entitySpec = adminSchema.getEntityTypeSpecification(type);
  if (!entitySpec) return notOk.Generic(`No entity spec for type ${type}`);

  if (entitySpec.adminOnly) return notOk.Generic(`Entity type is admin only`);

  const entityFields = decodeAdminEntityFields(adminSchema, entitySpec, fieldValues);

  const verifyFieldsResult = verifyFieldValuesAndCollectInformation(
    adminSchema,
    adminSchema.toPublishedSchema(),
    reference,
    type,
    entityFields
  );
  if (verifyFieldsResult.isError()) return verifyFieldsResult;

  const ensureReferencePublishedResult = await ensureReferencedEntitiesArePublishedAndCollectInfo(
    databaseAdapter,
    context,
    [{ entity: reference, references: verifyFieldsResult.value.references }]
  );
  if (ensureReferencePublishedResult.isError()) return ensureReferencePublishedResult;
  const referenceIds = ensureReferencePublishedResult.value.get(reference.id);
  assertIsDefined(referenceIds);

  return ok({
    fullTextSearchText: verifyFieldsResult.value.fullTextSearchText,
    locations: verifyFieldsResult.value.locations,
    valueTypes: verifyFieldsResult.value.valueTypes,
    referenceIds,
  });
}
