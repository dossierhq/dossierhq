import type { EntityReference, ErrorType, PromiseResult, PublishingHistory } from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import { authVerifyAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';

export async function adminGetPublishingHistory(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  reference: EntityReference
): PromiseResult<
  PublishingHistory,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotFound
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  const entityInfoResult = await databaseAdapter.adminEntityPublishingHistoryGetEntityInfo(
    context,
    reference
  );
  if (entityInfoResult.isError()) {
    return entityInfoResult;
  }
  const { entityInternalId, authKey, resolvedAuthKey } = entityInfoResult.value;

  const authResult = await authVerifyAuthorizationKey(authorizationAdapter, context, {
    authKey,
    resolvedAuthKey,
  });
  if (authResult.isError()) {
    return authResult;
  }

  const eventsResult = await databaseAdapter.adminEntityPublishingHistoryGetEvents(context, {
    entityInternalId,
  });
  if (eventsResult.isError()) {
    return eventsResult;
  }

  return ok({
    id: reference.id,
    events: eventsResult.value,
  });
}
