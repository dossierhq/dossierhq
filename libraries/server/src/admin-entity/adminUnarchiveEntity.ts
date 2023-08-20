import type {
  AdminEntityUnarchivePayload,
  EntityReference,
  ErrorType,
  PromiseResult,
} from '@dossierhq/core';
import { AdminEntityStatus, ok } from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import { authVerifyAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';

export async function adminUnarchiveEntity(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  reference: EntityReference,
): PromiseResult<
  AdminEntityUnarchivePayload,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.NotFound
  | typeof ErrorType.Generic
> {
  return context.withTransaction(async (context) => {
    // Step 1: Get entity info
    const entityInfoResult = await databaseAdapter.adminEntityArchivingGetEntityInfo(
      context,
      reference,
    );
    if (entityInfoResult.isError()) return entityInfoResult;
    const {
      entityInternalId,
      entityVersionInternalId,
      authKey,
      resolvedAuthKey,
      status,
      neverPublished,
    } = entityInfoResult.value;

    // Step 2: Verify authKey
    const authResult = await authVerifyAuthorizationKey(authorizationAdapter, context, {
      authKey,
      resolvedAuthKey,
    });
    if (authResult.isError()) return authResult;

    const result: AdminEntityUnarchivePayload = {
      id: reference.id,
      status,
      effect: 'none',
      updatedAt: entityInfoResult.value.updatedAt,
    };

    if (result.status === AdminEntityStatus.archived) {
      result.status = neverPublished ? AdminEntityStatus.draft : AdminEntityStatus.withdrawn;
      result.effect = 'unarchived';

      // Step 3: Update entity status
      const unarchiveResult = await databaseAdapter.adminEntityUpdateStatus(
        context,
        result.status,
        { entityInternalId },
      );
      if (unarchiveResult.isError()) return unarchiveResult;
      result.updatedAt = unarchiveResult.value.updatedAt;

      // Step 4: Create publishing event
      const createEventResult = await databaseAdapter.adminEntityPublishingCreateEvents(context, {
        session: context.session,
        kind: 'unarchive',
        references: [{ entityInternalId, entityVersionInternalId }],
        onlyLegacyEvents: false,
      });
      if (createEventResult.isError()) return createEventResult;
    }

    //
    return ok(result);
  });
}
