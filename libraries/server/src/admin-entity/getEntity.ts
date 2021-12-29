import type {
  AdminEntity,
  AdminSchema,
  EntityReferenceWithAuthKeys,
  EntityVersionReferenceWithAuthKeys,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '..';
import { authVerifyAuthorizationKey } from '../Auth';
import { decodeAdminEntity2 } from '../EntityCodec';

export async function adminGetEntity(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  reference: EntityReferenceWithAuthKeys | EntityVersionReferenceWithAuthKeys
): PromiseResult<
  AdminEntity,
  ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const { authKeys, ...referenceWithoutAuthKeys } = reference;
  const getResult = await databaseAdapter.adminEntityGetOne(context, referenceWithoutAuthKeys);
  if (getResult.isError()) {
    return getResult;
  }
  const entityValues = getResult.value;

  const authResult = await authVerifyAuthorizationKey(
    authorizationAdapter,
    context,
    reference?.authKeys,
    { authKey: entityValues.authKey, resolvedAuthKey: entityValues.resolvedAuthKey }
  );
  if (authResult.isError()) {
    return authResult;
  }

  const entity = decodeAdminEntity2(schema, entityValues);

  return ok(entity);
}
