import {
  EntityStatus,
  EventType,
  notOk,
  ok,
  type DeleteEntitiesSyncEvent,
  type DossierClient,
  type EntityDeletePayload,
  type EntityReference,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import { authVerifyAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { checkUUIDsAreUnique } from './AdminEntityMutationUtils.js';

export async function adminDeleteEntity(
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  references: EntityReference[],
): ReturnType<DossierClient['deleteEntities']> {
  return doAdminDeleteEntity(authorizationAdapter, databaseAdapter, context, references, null);
}

export async function adminDeleteEntitySyncEvent(
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  syncEvent: DeleteEntitiesSyncEvent,
) {
  return doAdminDeleteEntity(
    authorizationAdapter,
    databaseAdapter,
    context,
    syncEvent.entities,
    syncEvent,
  );
}

async function doAdminDeleteEntity(
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  references: EntityReference[],
  syncEvent: DeleteEntitiesSyncEvent | null,
): ReturnType<DossierClient['deleteEntities']> {
  if (context.session.type === 'readonly') {
    return notOk.BadRequest('Readonly session used to delete entity');
  }
  const { session } = context;

  const uniqueIdCheck = checkUUIDsAreUnique(references);
  if (uniqueIdCheck.isError()) return uniqueIdCheck;

  if (references.length === 0) {
    return notOk.BadRequest('No references provided');
  }

  return context.withTransaction(async (context) => {
    const entityInfoResult = await databaseAdapter.adminEntityDeleteGetEntityInfo(
      context,
      references,
    );
    if (entityInfoResult.isError()) return entityInfoResult;
    const entityInfos = entityInfoResult.value;

    for (const { entityId, authKey, resolvedAuthKey, status, referencedBy } of entityInfos) {
      // Step 2: Verify authKey
      const authResult = await authVerifyAuthorizationKey(authorizationAdapter, context, {
        authKey,
        resolvedAuthKey,
      });
      if (authResult.isError()) return authResult;

      // Step 3: Check status
      if (status !== EntityStatus.archived) {
        return notOk.BadRequest(`Entity is not archived (id: ${entityId}, status: ${status})`);
      }

      // Step 4: Check if it's referenced by other entities
      const referencedByOthers = referencedBy.filter(
        (it) => !references.find((ref) => ref.id === it.id),
      );
      if (referencedByOthers.length > 0) {
        return notOk.BadRequest(
          `Entity (${entityId}) is referenced by other entities (${referencedByOthers.map((it) => it.id).join(', ')})`,
        );
      }
    }

    // Step 5: Delete entities
    const deleteResult = await databaseAdapter.adminEntityDeleteEntities(
      context,
      entityInfos.map(({ entityInternalId }) => ({ entityInternalId })),
      syncEvent,
    );
    if (deleteResult.isError()) return deleteResult;

    // Step 6: Create event
    const publishingEventResult = await databaseAdapter.adminEntityCreateEntityEvent(
      context,
      {
        session,
        type: EventType.deleteEntities,
        references: entityInfos.map(({ entityVersionInternalId }) => ({ entityVersionInternalId })),
      },
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
