import type {
  AdminEntityUnarchivePayload,
  EntityReferenceWithAuthKeys,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import { AdminEntityStatus, ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type { AuthorizationAdapter, SessionContext } from '..';
import { authVerifyAuthorizationKey } from '../Auth';

export async function adminUnarchiveEntity(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  reference: EntityReferenceWithAuthKeys
): PromiseResult<
  AdminEntityUnarchivePayload,
  ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.NotFound | ErrorType.Generic
> {
  return context.withTransaction(async (context) => {
    // Step 1: Get entity info
    const entityInfoResult = await databaseAdapter.adminEntityArchivingGetEntityInfo(
      context,
      reference
    );
    if (entityInfoResult.isError()) {
      return entityInfoResult;
    }
    const { entityInternalId, authKey, resolvedAuthKey, status, neverPublished } =
      entityInfoResult.value;

    // Step 2: Verify authKeys
    const authResult = await authVerifyAuthorizationKey(
      authorizationAdapter,
      context,
      reference?.authKeys,
      { authKey, resolvedAuthKey }
    );
    if (authResult.isError()) {
      return authResult;
    }

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
        {
          entityInternalId,
        }
      );
      if (unarchiveResult.isError()) {
        return unarchiveResult;
      }
      result.updatedAt = unarchiveResult.value.updatedAt;

      // Step 4: Create publishing event
      const createEventResult = await databaseAdapter.adminEntityPublishingCreateEvents(context, {
        session: context.session,
        kind: 'unarchive',
        references: [{ entityInternalId }],
      });
      if (createEventResult.isError()) {
        return createEventResult;
      }
    }

    //
    return ok(result);
  });
}
