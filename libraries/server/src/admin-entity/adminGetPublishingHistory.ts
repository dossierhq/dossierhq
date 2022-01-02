import type {
  EntityReferenceWithAuthKeys,
  ErrorType,
  PromiseResult,
  PublishingHistory,
} from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '..';
import { authVerifyAuthorizationKey } from '../Auth';

export async function adminGetPublishingHistory(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  reference: EntityReferenceWithAuthKeys
): PromiseResult<
  PublishingHistory,
  ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const entityInfoResult = await databaseAdapter.adminEntityPublishingHistoryGetEntityInfo(
    context,
    reference
  );
  if (entityInfoResult.isError()) {
    return entityInfoResult;
  }
  const { entityInternalId, authKey, resolvedAuthKey } = entityInfoResult.value;

  const authResult = await authVerifyAuthorizationKey(
    authorizationAdapter,
    context,
    reference?.authKeys,
    { authKey, resolvedAuthKey }
  );
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
