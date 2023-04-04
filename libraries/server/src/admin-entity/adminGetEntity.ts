import type {
  AdminEntity,
  AdminSchema,
  EntityReference,
  EntityVersionReference,
  ErrorType,
  PromiseResult,
  UniqueIndexReference,
} from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import { authVerifyAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { decodeAdminEntity } from '../EntityCodec.js';

export async function adminGetEntity(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  reference: EntityReference | EntityVersionReference | UniqueIndexReference
): PromiseResult<
  AdminEntity,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotFound
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  const getResult = await databaseAdapter.adminEntityGetOne(context, reference);
  if (getResult.isError()) return getResult;
  const entityValues = getResult.value;

  const authResult = await authVerifyAuthorizationKey(authorizationAdapter, context, {
    authKey: entityValues.authKey,
    resolvedAuthKey: entityValues.resolvedAuthKey,
  });
  if (authResult.isError()) return authResult;

  const entity = decodeAdminEntity(schema, entityValues);

  return ok(entity);
}
