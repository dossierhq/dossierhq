import type {
  EntityUnpublishPayload,
  EntityReference,
  ErrorType,
  PromiseResult,
  UnpublishEntitiesSyncEvent,
} from '@dossierhq/core';
import { EntityStatus, EventType, createErrorResult, notOk, ok } from '@dossierhq/core';
import type { DatabaseAdapter, WriteSession } from '@dossierhq/database-adapter';
import { authVerifyAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { assertIsDefined } from '../utils/AssertUtils.js';
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
  status: EntityStatus;
  updatedAt: Date;
}

export function adminUnpublishEntities(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  references: EntityReference[],
): PromiseResult<
  EntityUnpublishPayload[],
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotFound
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  return doUnpublishEntities(databaseAdapter, authorizationAdapter, context, references, null);
}

export function adminUnpublishEntitiesSyncEvent(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  syncEvent: UnpublishEntitiesSyncEvent,
) {
  return doUnpublishEntities(
    databaseAdapter,
    authorizationAdapter,
    context,
    syncEvent.entities,
    syncEvent,
  );
}

async function doUnpublishEntities(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  references: EntityReference[],
  syncEvent: UnpublishEntitiesSyncEvent | null,
): PromiseResult<
  EntityUnpublishPayload[],
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotFound
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  if (context.session.type === 'readonly') {
    return notOk.BadRequest('Readonly session used to unpublish entities');
  }
  const { session } = context;

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
      session,
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

      if (it.status === EntityStatus.modified || it.status === EntityStatus.published) {
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
): PromiseResult<EntityUnpublishPayload[], typeof ErrorType.Generic> {
  const unpublishResult = await databaseAdapter.adminEntityUnpublishEntities(
    context,
    EntityStatus.withdrawn,
    unpublishEntitiesInfo.map((it) => ({ entityInternalId: it.entityInternalId })),
    syncEvent,
  );
  if (unpublishResult.isError()) return unpublishResult;
  const unpublishRows = unpublishResult.value;

  const payload: EntityUnpublishPayload[] = [];
  for (const entityInfo of entitiesInfo) {
    if (entityInfo.effect === 'unpublished') {
      const updatedAt = unpublishRows.find(
        (it) => it.entityInternalId === entityInfo.entityInternalId,
      )?.updatedAt;
      assertIsDefined(updatedAt);
      payload.push({
        id: entityInfo.id,
        status: EntityStatus.withdrawn,
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
  session: WriteSession,
  unpublishEntityInfo: EntityInfoToBeUnpublished[],
  syncEvent: UnpublishEntitiesSyncEvent | null,
): PromiseResult<void, typeof ErrorType.Generic> {
  if (unpublishEntityInfo.length === 0) {
    return ok(undefined);
  }
  return await databaseAdapter.adminEntityCreateEntityEvent(
    context,
    {
      session,
      type: EventType.unpublishEntities,
      references: unpublishEntityInfo.map(({ entityInternalId, entityVersionInternalId }) => ({
        entityInternalId,
        entityVersionInternalId,
      })),
    },
    syncEvent,
  );
}
