import {
  ErrorType,
  isEntityNameAsRequested,
  notOk,
  ok,
  type AdminEntityMutationOptions,
  type AdminEntityUpdate,
  type AdminEntityUpsert,
  type AdminEntityUpsertPayload,
  type SchemaWithMigrations,
  type ErrorResult,
  type PromiseResult,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { adminCreateEntity } from './adminCreateEntity.js';
import { adminUpdateEntity } from './adminUpdateEntity.js';

export async function adminUpsertEntity(
  adminSchema: SchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: AdminEntityUpsert,
  options: AdminEntityMutationOptions | undefined,
): PromiseResult<
  AdminEntityUpsertPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  const nameResult = await databaseAdapter.adminEntityGetEntityName(context, { id: entity.id });

  if (nameResult.isError() && nameResult.isErrorType(ErrorType.NotFound)) {
    return await createNewEntity(
      adminSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      entity,
      options,
    );
  } else if (nameResult.isError()) {
    return nameResult as ErrorResult<unknown, typeof ErrorType.Generic>;
  }

  let entityUpdate: AdminEntityUpdate = entity;
  if (isEntityNameAsRequested(nameResult.value, entity.info.name)) {
    // Remove name since we don't to change it the current name is the same but with a #number
    entityUpdate = { ...entityUpdate, info: { ...entityUpdate.info, name: undefined } };
  }

  if (entityUpdate.info?.authKey === undefined || entityUpdate.info.authKey === null) {
    entityUpdate = { ...entityUpdate, info: { ...entityUpdate.info, authKey: '' } };
  }

  const updateResult = await adminUpdateEntity(
    adminSchema,
    authorizationAdapter,
    databaseAdapter,
    context,
    entityUpdate,
    options,
  );
  if (updateResult.isOk()) {
    return ok(updateResult.value);
  } else if (
    updateResult.isErrorType(ErrorType.BadRequest) ||
    updateResult.isErrorType(ErrorType.NotAuthorized) ||
    updateResult.isErrorType(ErrorType.Generic)
  ) {
    return updateResult;
  }
  return notOk.GenericUnexpectedError(updateResult);
}

async function createNewEntity(
  adminSchema: SchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: AdminEntityUpsert,
  options: AdminEntityMutationOptions | undefined,
): PromiseResult<
  AdminEntityUpsertPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  const createResult = await adminCreateEntity(
    adminSchema,
    authorizationAdapter,
    databaseAdapter,
    context,
    entity,
    options,
  );
  if (createResult.isOk()) {
    return createResult.map((value) => value);
  } else if (createResult.isErrorType(ErrorType.Conflict)) {
    return adminUpsertEntity(
      adminSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      entity,
      options,
    );
  } else if (
    createResult.isErrorType(ErrorType.BadRequest) ||
    createResult.isErrorType(ErrorType.NotAuthorized) ||
    createResult.isErrorType(ErrorType.Generic)
  ) {
    return createResult;
  }
  return notOk.GenericUnexpectedError(createResult);
}
