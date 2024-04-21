import {
  EntityStatus,
  EventType,
  notOk,
  ok,
  type EntityUnarchivePayload,
  type EntityReference,
  type ErrorType,
  type PromiseResult,
  type UnarchiveEntitySyncEvent,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import { authVerifyAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';

export function adminUnarchiveEntity(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  reference: EntityReference,
): PromiseResult<
  EntityUnarchivePayload,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.NotFound
  | typeof ErrorType.Generic
> {
  return doUnarchiveEntity(databaseAdapter, authorizationAdapter, context, reference, null);
}

export function adminUnarchiveEntitySyncEvent(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  syncEvent: UnarchiveEntitySyncEvent,
) {
  return doUnarchiveEntity(
    databaseAdapter,
    authorizationAdapter,
    context,
    syncEvent.entity,
    syncEvent,
  );
}

async function doUnarchiveEntity(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  reference: EntityReference,
  syncEvent: UnarchiveEntitySyncEvent | null,
): PromiseResult<
  EntityUnarchivePayload,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.NotFound
  | typeof ErrorType.Generic
> {
  if (context.session.type === 'readonly') {
    return notOk.BadRequest('Readonly session used to unarchive entity');
  }
  const { session } = context;

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

    const result: EntityUnarchivePayload = {
      id: reference.id,
      status,
      effect: 'none',
      updatedAt: entityInfoResult.value.updatedAt,
    };

    if (result.status === EntityStatus.archived) {
      result.status = neverPublished ? EntityStatus.draft : EntityStatus.withdrawn;
      result.effect = 'unarchived';

      // Step 3: Update entity status
      const unarchiveResult = await databaseAdapter.adminEntityUpdateStatus(
        context,
        result.status,
        { entityInternalId },
        syncEvent,
      );
      if (unarchiveResult.isError()) return unarchiveResult;
      result.updatedAt = unarchiveResult.value.updatedAt;

      // Step 4: Create publishing event
      const createEventResult = await databaseAdapter.adminEntityCreateEntityEvent(
        context,
        { session, type: EventType.unarchiveEntity, references: [{ entityVersionInternalId }] },
        syncEvent,
      );
      if (createEventResult.isError()) return createEventResult;
    }

    //
    return ok(result);
  });
}
