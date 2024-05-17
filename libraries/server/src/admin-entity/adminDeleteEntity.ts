import {
  EntityStatus,
  EventType,
  notOk,
  ok,
  type DeleteEntitySyncEvent,
  type DossierClient,
  type EntityDeletePayload,
  type EntityReference,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import { authVerifyAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';

export async function adminDeleteEntity(
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  reference: EntityReference,
): ReturnType<DossierClient['deleteEntity']> {
  return doAdminDeleteEntity(authorizationAdapter, databaseAdapter, context, reference, null);
}

export async function adminDeleteEntitySyncEvent(
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  syncEvent: DeleteEntitySyncEvent,
) {
  return doAdminDeleteEntity(
    authorizationAdapter,
    databaseAdapter,
    context,
    syncEvent.entity,
    syncEvent,
  );
}

async function doAdminDeleteEntity(
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  reference: EntityReference,
  syncEvent: DeleteEntitySyncEvent | null,
): ReturnType<DossierClient['deleteEntity']> {
  if (context.session.type === 'readonly') {
    return notOk.BadRequest('Readonly session used to delete entity');
  }
  const { session } = context;

  //TODO check no incoming references

  return context.withTransaction(async (context) => {
    //TODO check which get info to use
    // Step 1: Get entity info
    const entityInfoResult = await databaseAdapter.adminEntityArchivingGetEntityInfo(
      context,
      reference,
    );
    if (entityInfoResult.isError()) return entityInfoResult;
    const { entityInternalId, entityVersionInternalId, authKey, resolvedAuthKey, status } =
      entityInfoResult.value;

    // Step 2: Verify authKey
    const authResult = await authVerifyAuthorizationKey(authorizationAdapter, context, {
      authKey,
      resolvedAuthKey,
    });
    if (authResult.isError()) return authResult;

    // Step 3: Check status
    if (status !== EntityStatus.archived) {
      return notOk.BadRequest(`Entity is not archived (status: ${status})`);
    }

    // Step 4: Delete entity
    const deleteResult = await databaseAdapter.adminEntityDeleteEntity(
      context,
      { entityInternalId },
      syncEvent,
    );
    if (deleteResult.isError()) return deleteResult;

    // Step 5: Create publishing event
    const publishingEventResult = await databaseAdapter.adminEntityCreateEntityEvent(
      context,
      { session, type: EventType.deleteEntity, references: [{ entityVersionInternalId }] },
      syncEvent,
    );
    if (publishingEventResult.isError()) return publishingEventResult;

    // Done
    const value: EntityDeletePayload = {
      effect: 'deleted',
      deletedAt: deleteResult.value.deletedAt,
    };
    return ok(value);
  });
}
