import type {
  AdminEntityMutationOptions,
  AdminEntityUpdate,
  AdminEntityUpsert,
  AdminEntityUpsertPayload,
  AdminSchema,
  ErrorResult,
  PromiseResult,
} from '@jonasb/datadata-core';
import { ErrorType, isEntityNameAsRequested, notOk, ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { adminCreateEntity } from './adminCreateEntity.js';
import { adminUpdateEntity } from './adminUpdateEntity.js';

export async function adminUpsertEntity(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: AdminEntityUpsert,
  options: AdminEntityMutationOptions | undefined
): PromiseResult<
  AdminEntityUpsertPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  const nameResult = await databaseAdapter.adminEntityGetEntityName(context, { id: entity.id });

  if (nameResult.isError() && nameResult.isErrorType(ErrorType.NotFound)) {
    return await createNewEntity(
      schema,
      authorizationAdapter,
      databaseAdapter,
      context,
      entity,
      options
    );
  } else if (nameResult.isError()) {
    return nameResult as ErrorResult<unknown, typeof ErrorType.Generic>;
  }

  let entityUpdate: AdminEntityUpdate = entity;
  if (isEntityNameAsRequested(nameResult.value, entity.info.name)) {
    // Remove name since we don't to change it the current name is the same but with a #number
    entityUpdate = { ...entity, info: { ...entity.info, name: undefined } };
  }

  const updateResult = await adminUpdateEntity(
    schema,
    authorizationAdapter,
    databaseAdapter,
    context,
    entityUpdate,
    options
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
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: AdminEntityUpsert,
  options: AdminEntityMutationOptions | undefined
): PromiseResult<
  AdminEntityUpsertPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  const createResult = await adminCreateEntity(
    schema,
    authorizationAdapter,
    databaseAdapter,
    context,
    entity,
    options
  );
  if (createResult.isOk()) {
    return createResult.map((value) => value);
  } else if (createResult.isErrorType(ErrorType.Conflict)) {
    return adminUpsertEntity(
      schema,
      authorizationAdapter,
      databaseAdapter,
      context,
      entity,
      options
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
