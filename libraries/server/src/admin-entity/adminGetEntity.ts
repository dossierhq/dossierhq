import type {
  AdminEntity,
  AdminSchema,
  EntityReference,
  EntityUniqueIndexReference,
  EntityVersionReference,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import { authVerifyAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { decodeAdminEntity } from '../EntityCodec.js';

export async function adminGetEntity(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  reference: EntityReference | EntityVersionReference | EntityUniqueIndexReference
): PromiseResult<
  AdminEntity,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotFound
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  const getResult = await databaseAdapter.adminEntityGetOne(context, reference);
  if (getResult.isError()) {
    return getResult;
  }
  const entityValues = getResult.value;

  const authResult = await authVerifyAuthorizationKey(authorizationAdapter, context, {
    authKey: entityValues.authKey,
    resolvedAuthKey: entityValues.resolvedAuthKey,
  });
  if (authResult.isError()) {
    return authResult;
  }

  const entity = decodeAdminEntity(schema, entityValues);

  return ok(entity);
}
