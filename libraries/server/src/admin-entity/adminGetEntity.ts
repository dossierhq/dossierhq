import type {
  AdminEntity,
  AdminSchema,
  EntityReference,
  EntityVersionReference,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type { AuthorizationAdapter, SessionContext } from '..';
import { authVerifyAuthorizationKey } from '../Auth';
import { decodeAdminEntity } from '../EntityCodec';

export async function adminGetEntity(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  reference: EntityReference | EntityVersionReference
): PromiseResult<
  AdminEntity,
  ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
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
