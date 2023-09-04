import type {
  AdminEntityUnpublishPayload,
  EntityReference,
  ErrorType,
  PromiseResult,
  UnpublishEntitiesSyncEvent,
} from '@dossierhq/core';
import {
  AdminEntityStatus,
  EventType,
  assertIsDefined,
  createErrorResult,
  notOk,
  ok,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import { authVerifyAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { checkUUIDsAreUnique } from './AdminEntityMutationUtils.js';
import { updateUniqueIndexesForEntity } from './updateUniqueIndexesForEntity.js';

interface EntityInfoToBeUnpublished {
  effect: 'unpublished';
  id: string;
  entityInternalId: unknown;
  entityVersionInternalId: unknown;
  authKey: string;
  resolvedAuthKey: string;
}

interface EntityInfoAlreadyUnpublished {
  effect: 'none';
  id: string;
  authKey: string;
  resolvedAuthKey: string;
  status: AdminEntityStatus;
  updatedAt: Date;
}

export function adminUnpublishEntities(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  references: EntityReference[],
): PromiseResult<
  AdminEntityUnpublishPayload[],
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotFound
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  return doIt(databaseAdapter, authorizationAdapter, context, references, null);
}

export function adminUnpublishEntitiesSyncEvent(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  syncEvent: UnpublishEntitiesSyncEvent,
) {
  return doIt(databaseAdapter, authorizationAdapter, context, syncEvent.entities, syncEvent);
}

async function doIt(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  references: EntityReference[],
  syncEvent: UnpublishEntitiesSyncEvent | null,
): PromiseResult<
  AdminEntityUnpublishPayload[],
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotFound
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  const uniqueIdCheck = checkUUIDsAreUnique(references);
  if (uniqueIdCheck.isError()) return uniqueIdCheck;

  return context.withTransaction(async (context) => {
    // Step 1: Resolve entities and check if all entities exist
    const collectResult = await collectEntityInfo(databaseAdapter, context, references);
    if (collectResult.isError()) return collectResult;
    const entitiesInfo = collectResult.value;
    const unpublishEntitiesInfo = entitiesInfo.filter(
      ({ effect }) => effect === 'unpublished',
    ) as EntityInfoToBeUnpublished[];

    // Step 2: Check authKey
    for (const entityInfo of entitiesInfo) {
      const authResult = await authVerifyAuthorizationKey(authorizationAdapter, context, {
        authKey: entityInfo.authKey,
        resolvedAuthKey: entityInfo.resolvedAuthKey,
      });
      if (authResult.isError()) {
        return createErrorResult(
          authResult.error,
          `entity(${entityInfo.id}): ${authResult.message}`,
        );
      }
    }

    // Step 3: Unpublish entities
    const unpublishResult = await unpublishEntitiesAndCollectResult(
      databaseAdapter,
      context,
      entitiesInfo,
      unpublishEntitiesInfo,
      syncEvent,
    );
    if (unpublishResult.isError()) return unpublishResult;

    // Step 4: Check if references are ok
    const checkReferencedEntitiesResult = await ensureReferencedEntitiesAreNotPublished(
      databaseAdapter,
      context,
      unpublishEntitiesInfo,
    );
    if (checkReferencedEntitiesResult.isError()) return checkReferencedEntitiesResult;

    // Step 5: Create publish event
    const unpublishEventsResult = await createUnpublishEvents(
      databaseAdapter,
      context,
      unpublishEntitiesInfo,
      syncEvent,
    );
    if (unpublishEventsResult.isError()) return unpublishEventsResult;

    // Step 6: Remove unique values
    for (const entity of unpublishEntitiesInfo) {
      const uniqueIndexResult = await updateUniqueIndexesForEntity(
        databaseAdapter,
        context,
        { entityInternalId: entity.entityInternalId },
        false,
        null,
        new Map(),
      );
      if (uniqueIndexResult.isError()) return uniqueIndexResult;
    }

    //
    return unpublishResult;
  });
}

async function collectEntityInfo(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  references: EntityReference[],
): PromiseResult<
  (EntityInfoToBeUnpublished | EntityInfoAlreadyUnpublished)[],
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const result = await databaseAdapter.adminEntityUnpublishGetEntitiesInfo(context, references);
  if (result.isError()) return result;

  return result.map((entities) =>
    entities.map((it) => {
      const shared = {
        id: it.id,
        entityInternalId: it.entityInternalId,
        authKey: it.authKey,
        resolvedAuthKey: it.resolvedAuthKey,
      };

      if (it.status === AdminEntityStatus.modified || it.status === AdminEntityStatus.published) {
        return {
          effect: 'unpublished',
          entityVersionInternalId: it.entityVersionInternalId,
          ...shared,
        };
      }
      return {
        effect: 'none',
        ...shared,
        status: it.status,
        updatedAt: it.updatedAt,
      };
    }),
  );
}

async function unpublishEntitiesAndCollectResult(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entitiesInfo: (EntityInfoToBeUnpublished | EntityInfoAlreadyUnpublished)[],
  unpublishEntitiesInfo: EntityInfoToBeUnpublished[],
  syncEvent: UnpublishEntitiesSyncEvent | null,
): PromiseResult<AdminEntityUnpublishPayload[], typeof ErrorType.Generic> {
  const unpublishResult = await databaseAdapter.adminEntityUnpublishEntities(
    context,
    AdminEntityStatus.withdrawn,
    unpublishEntitiesInfo.map((it) => ({ entityInternalId: it.entityInternalId })),
    syncEvent,
  );
  if (unpublishResult.isError()) return unpublishResult;
  const unpublishRows = unpublishResult.value;

  const payload: AdminEntityUnpublishPayload[] = [];
  for (const entityInfo of entitiesInfo) {
    if (entityInfo.effect === 'unpublished') {
      const updatedAt = unpublishRows.find(
        (it) => it.entityInternalId === entityInfo.entityInternalId,
      )?.updatedAt;
      assertIsDefined(updatedAt);
      payload.push({
        id: entityInfo.id,
        status: AdminEntityStatus.withdrawn,
        effect: entityInfo.effect,
        updatedAt,
      });
    } else {
      payload.push({
        id: entityInfo.id,
        status: entityInfo.status,
        effect: entityInfo.effect,
        updatedAt: entityInfo.updatedAt,
      });
    }
  }
  return ok(payload);
}

async function ensureReferencedEntitiesAreNotPublished(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  unpublishEntitiesInfo: EntityInfoToBeUnpublished[],
): PromiseResult<void, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const referenceErrorMessages: string[] = [];
  for (const { id, entityInternalId } of unpublishEntitiesInfo) {
    const result = await databaseAdapter.adminEntityUnpublishGetPublishedReferencedEntities(
      context,
      { entityInternalId },
    );
    if (result.isError()) {
      return result;
    }
    if (result.value.length > 0) {
      referenceErrorMessages.push(
        `${id}: Published entities referencing entity: ${result.value
          .map(({ id }) => id)
          .join(', ')}`,
      );
    }
  }

  if (referenceErrorMessages.length > 0) {
    return notOk.BadRequest(referenceErrorMessages.join('\n'));
  }
  return ok(undefined);
}

async function createUnpublishEvents(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  unpublishEntityInfo: EntityInfoToBeUnpublished[],
  syncEvent: UnpublishEntitiesSyncEvent | null,
): PromiseResult<void, typeof ErrorType.Generic> {
  if (unpublishEntityInfo.length === 0) {
    return ok(undefined);
  }
  return await databaseAdapter.adminEntityCreateEntityEvent(
    context,
    {
      session: context.session,
      type: EventType.unpublishEntities,
      references: unpublishEntityInfo.map(({ entityInternalId, entityVersionInternalId }) => ({
        entityInternalId,
        entityVersionInternalId,
      })),
    },
    syncEvent,
  );
}
