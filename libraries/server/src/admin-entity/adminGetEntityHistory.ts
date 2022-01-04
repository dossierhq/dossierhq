import type {
  EntityHistory,
  EntityReference,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type { AuthorizationAdapter, SessionContext } from '..';
import { authVerifyAuthorizationKey } from '../Auth';

export async function adminGetEntityHistory(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  reference: EntityReference
): PromiseResult<
  EntityHistory,
  ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const entityInfoResult = await databaseAdapter.adminEntityHistoryGetEntityInfo(
    context,
    reference
  );
  if (entityInfoResult.isError()) {
    return entityInfoResult;
  }
  const { entityInternalId, entityVersionInternalId, authKey, resolvedAuthKey } =
    entityInfoResult.value;

  const authResult = await authVerifyAuthorizationKey(authorizationAdapter, context, {
    authKey,
    resolvedAuthKey,
  });
  if (authResult.isError()) {
    return authResult;
  }

  const versionsResult = await databaseAdapter.adminEntityHistoryGetVersionsInfo(context, {
    entityInternalId,
  });
  if (versionsResult.isError()) {
    return versionsResult;
  }

  const result: EntityHistory = {
    id: reference.id,
    versions: versionsResult.value.map((v) => ({
      version: v.version,
      published: v.entityVersionInternalId === entityVersionInternalId,
      createdBy: v.createdBy,
      createdAt: v.createdAt,
    })),
  };
  return ok(result);
}
