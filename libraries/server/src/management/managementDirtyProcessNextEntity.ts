import {
  ErrorType,
  copyEntity,
  normalizeEntityFields,
  notOk,
  ok,
  validateEntityInfo,
  type AdminEntity,
  type AdminSchema,
  type PromiseResult,
} from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabaseEntityIndexesArg,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { decodeAdminEntity, encodeAdminEntity } from '../EntityCodec.js';

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

    const {
      dirtyValidateLatest,
      dirtyValidatePublished: _todo1,
      dirtyIndexLatest,
      dirtyIndexPublished: _todo2,
    } = entityResult.value;
    let valid = entityResult.value.valid;

    if (dirtyValidateLatest || dirtyIndexLatest) {
      const entity = decodeAdminEntity(adminSchema, entityResult.value);
      const validationResult = await validateEntity(adminSchema, databaseAdapter, context, entity);
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

    const updateResult = await databaseAdapter.managementDirtyUpdateEntity(
      context,
      entityResult.value,
      valid
    );
    if (updateResult.isError()) return updateResult;

    return ok({ id: entityResult.value.id, valid });
  });
}

async function validateEntity(
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
