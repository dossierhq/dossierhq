import type {
  AdminEntity,
  SchemaWithMigrations,
  EntityReference,
  EntityVersionReference,
  ErrorType,
  PromiseResult,
  UniqueIndexReference,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import { authVerifyAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { decodeAdminEntity } from '../EntityCodec.js';
import { validateEntityReference } from '../utils/ValidationUtils.js';

export async function adminGetEntity(
  schema: SchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  reference: EntityReference | EntityVersionReference | UniqueIndexReference,
): PromiseResult<
  AdminEntity,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotFound
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  const validationResult = validateEntityReference(reference);
  if (validationResult.isError()) return validationResult;

  const getResult = await databaseAdapter.adminEntityGetOne(context, reference);
  if (getResult.isError()) return getResult;
  const entityValues = getResult.value;

  const authResult = await authVerifyAuthorizationKey(authorizationAdapter, context, {
    authKey: entityValues.authKey,
    resolvedAuthKey: entityValues.resolvedAuthKey,
  });
  if (authResult.isError()) return authResult;

  return decodeAdminEntity(schema, entityValues);
}
