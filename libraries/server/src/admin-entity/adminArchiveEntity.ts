import type {
  AdminEntityArchivePayload,
  EntityReference,
  ErrorType,
  PromiseResult,
} from '@dossierhq/core';
import { AdminEntityStatus, notOk, ok } from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import { authVerifyAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';

export async function adminArchiveEntity(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  reference: EntityReference
): PromiseResult<
  AdminEntityArchivePayload,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotFound
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
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
    const { entityInternalId, authKey, resolvedAuthKey, status } = entityInfoResult.value;

    // Step 2: Verify authKey
    const authResult = await authVerifyAuthorizationKey(authorizationAdapter, context, {
      authKey,
      resolvedAuthKey,
    });
    if (authResult.isError()) {
      return authResult;
    }

    // Step 3: Check status
    if (status === AdminEntityStatus.modified || status === AdminEntityStatus.published) {
      return notOk.BadRequest('Entity is published');
    }
    if (status === AdminEntityStatus.archived) {
      return ok({
        id: reference.id,
        status: AdminEntityStatus.archived,
        effect: 'none',
        updatedAt: entityInfoResult.value.updatedAt,
      }); // no change
    }

    //TODO archive and creating publishing events can be performed in parallel

    // Step 4: Archive entity
    const archiveResult = await databaseAdapter.adminEntityUpdateStatus(
      context,
      AdminEntityStatus.archived,
      {
        entityInternalId,
      }
    );
    if (archiveResult.isError()) {
      return archiveResult;
    }

    // Step 5: Create publishing event
    const publishingEventResult = await databaseAdapter.adminEntityPublishingCreateEvents(context, {
      session: context.session,
      kind: 'archive',
      references: [{ entityInternalId }],
    });
    if (publishingEventResult.isError()) {
      return publishingEventResult;
    }

    // Done
    const value: AdminEntityArchivePayload = {
      id: reference.id,
      status: AdminEntityStatus.archived,
      effect: 'archived',
      updatedAt: archiveResult.value.updatedAt,
    };
    return ok(value);
  });
}
