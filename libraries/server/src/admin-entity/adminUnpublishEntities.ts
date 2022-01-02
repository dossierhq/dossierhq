import type {
  AdminEntityUnpublishPayload,
  EntityReferenceWithAuthKeys,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import {
  AdminEntityStatus,
  assertIsDefined,
  createErrorResult,
  notOk,
  ok,
} from '@jonasb/datadata-core';
import type { Temporal } from '@js-temporal/polyfill';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '..';
import { authVerifyAuthorizationKey } from '../Auth';
import { checkUUIDsAreUnique } from './AdminEntityMutationUtils';

interface EntityInfoToBeUnpublished {
  effect: 'unpublished';
  id: string;
  entityInternalId: unknown;
  referenceAuthKeys: string[] | undefined;
  authKey: string;
  resolvedAuthKey: string;
}

interface EntityInfoAlreadyUnpublished {
  effect: 'none';
  id: string;
  referenceAuthKeys: string[] | undefined;
  authKey: string;
  resolvedAuthKey: string;
  status: AdminEntityStatus;
  updatedAt: Temporal.Instant;
}

export async function adminUnpublishEntities(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  references: EntityReferenceWithAuthKeys[]
): PromiseResult<
  AdminEntityUnpublishPayload[],
  ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const uniqueIdCheck = checkUUIDsAreUnique(references);
  if (uniqueIdCheck.isError()) {
    return uniqueIdCheck;
  }

  return context.withTransaction(async (context) => {
    // Step 1: Resolve entities and check if all entities exist
    const collectResult = await collectEntityInfo(databaseAdapter, context, references);
    if (collectResult.isError()) {
      return collectResult;
    }
    const entitiesInfo = collectResult.value;
    const unpublishEntitiesInfo = entitiesInfo.filter(
      ({ effect }) => effect === 'unpublished'
    ) as EntityInfoToBeUnpublished[];

    // Step 2: Check authKeys
    for (const entityInfo of entitiesInfo) {
      const authResult = await authVerifyAuthorizationKey(
        authorizationAdapter,
        context,
        entityInfo.referenceAuthKeys,
        { authKey: entityInfo.authKey, resolvedAuthKey: entityInfo.resolvedAuthKey }
      );
      if (authResult.isError()) {
        return createErrorResult(
          authResult.error,
          `entity(${entityInfo.id}): ${authResult.message}`
        );
      }
    }

    // Step 3: Unpublish entities
    const unpublishResult = await unpublishEntitiesAndCollectResult(
      databaseAdapter,
      context,
      entitiesInfo,
      unpublishEntitiesInfo
    );
    if (unpublishResult.isError()) {
      return unpublishResult;
    }

    // Step 4: Check if references are ok
    const checkReferencedEntitiesResult = await ensureReferencedEntitiesAreNotPublished(
      databaseAdapter,
      context,
      unpublishEntitiesInfo
    );
    if (checkReferencedEntitiesResult.isError()) {
      return checkReferencedEntitiesResult;
    }

    // Step 5: Create publish event
    const unpublishEventsResult = await createUnpublishEvents(
      databaseAdapter,
      context,
      unpublishEntitiesInfo
    );
    if (unpublishEventsResult.isError()) {
      return unpublishEventsResult;
    }

    //
    return unpublishResult;
  });
}

async function collectEntityInfo(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  references: EntityReferenceWithAuthKeys[]
): PromiseResult<
  (EntityInfoToBeUnpublished | EntityInfoAlreadyUnpublished)[],
  ErrorType.NotFound | ErrorType.Generic
> {
  const result = await databaseAdapter.adminEntityUnpublishGetEntitiesInfo(context, references);
  if (result.isError()) {
    return result;
  }

  return result.map((entities) =>
    entities.map((it) => {
      const shared = {
        id: it.id,
        entityInternalId: it.entityInternalId,
        referenceAuthKeys: references.find(({ id }) => id === it.id)?.authKeys,
        authKey: it.authKey,
        resolvedAuthKey: it.resolvedAuthKey,
      };

      return [AdminEntityStatus.modified, AdminEntityStatus.published].includes(it.status)
        ? { effect: 'unpublished', ...shared }
        : {
            effect: 'none',
            ...shared,
            status: it.status,
            updatedAt: it.updatedAt,
          };
    })
  );
}

async function unpublishEntitiesAndCollectResult(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entitiesInfo: (EntityInfoToBeUnpublished | EntityInfoAlreadyUnpublished)[],
  unpublishEntitiesInfo: EntityInfoToBeUnpublished[]
): PromiseResult<AdminEntityUnpublishPayload[], ErrorType.Generic> {
  const unpublishResult = await databaseAdapter.adminEntityUnpublishEntities(
    context,
    AdminEntityStatus.withdrawn,
    unpublishEntitiesInfo.map((it) => ({ entityInternalId: it.entityInternalId }))
  );
  if (unpublishResult.isError()) {
    return unpublishResult;
  }
  const unpublishRows = unpublishResult.value;

  const result: AdminEntityUnpublishPayload[] = [];
  for (const entityInfo of entitiesInfo) {
    if (entityInfo.effect === 'unpublished') {
      const updatedAt = unpublishRows.find(
        (it) => it.entityInternalId === entityInfo.entityInternalId
      )?.updatedAt;
      assertIsDefined(updatedAt);
      result.push({
        id: entityInfo.id,
        status: AdminEntityStatus.withdrawn,
        effect: entityInfo.effect,
        updatedAt,
      });
    } else {
      result.push({
        id: entityInfo.id,
        status: entityInfo.status,
        effect: entityInfo.effect,
        updatedAt: entityInfo.updatedAt,
      });
    }
  }
  return ok(result);
}

async function ensureReferencedEntitiesAreNotPublished(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  unpublishEntitiesInfo: EntityInfoToBeUnpublished[]
): PromiseResult<void, ErrorType.BadRequest | ErrorType.Generic> {
  const referenceErrorMessages: string[] = [];
  for (const { id, entityInternalId } of unpublishEntitiesInfo) {
    const result = await databaseAdapter.adminEntityUnpublishGetPublishedReferencedEntities(
      context,
      { entityInternalId }
    );
    if (result.isError()) {
      return result;
    }
    if (result.value.length > 0) {
      referenceErrorMessages.push(
        `${id}: Published entities referencing entity: ${result.value
          .map(({ id }) => id)
          .join(', ')}`
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
  unpublishEntityInfo: EntityInfoToBeUnpublished[]
): PromiseResult<void, ErrorType.Generic> {
  if (unpublishEntityInfo.length === 0) {
    return ok(undefined);
  }
  return await databaseAdapter.adminEntityPublishingCreateEvents(context, {
    session: context.session,
    kind: 'unpublish',
    references: unpublishEntityInfo.map(({ entityInternalId }) => ({ entityInternalId })),
  });
}
