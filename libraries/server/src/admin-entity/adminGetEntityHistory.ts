import type { EntityHistory, EntityReference, ErrorType, PromiseResult } from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import { authVerifyAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';

export async function adminGetEntityHistory(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  reference: EntityReference
): PromiseResult<
  EntityHistory,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotFound
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
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
