import {
  ErrorType,
  EventType,
  notOk,
  ok,
  type SchemaWithMigrations,
  type CreatePrincipalSyncEvent,
  type PromiseResult,
  type SyncEvent,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import { authCreatePrincipalSyncEvent } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { InternalContext, SessionContext } from '../Context.js';
import { adminArchiveEntitySyncEvent } from '../admin-entity/adminArchiveEntity.js';
import { adminCreateEntitySyncEvent } from '../admin-entity/adminCreateEntity.js';
import { adminPublishEntitiesSyncEvent } from '../admin-entity/adminPublishEntities.js';
import { adminUnarchiveEntitySyncEvent } from '../admin-entity/adminUnarchiveEntity.js';
import { adminUnpublishEntitiesSyncEvent } from '../admin-entity/adminUnpublishEntities.js';
import { adminUpdateEntitySyncEvent } from '../admin-entity/adminUpdateEntity.js';
import { schemaUpdateSpecificationSyncEvent } from '../schema/schemaUpdateSpecification.js';
import { assertExhaustive } from '../utils/AssertUtils.js';

export async function managementApplyAuthSyncEvent(
  databaseAdapter: DatabaseAdapter,
  context: InternalContext,
  event: CreatePrincipalSyncEvent,
): PromiseResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  if (!(event.createdAt instanceof Date)) {
    return notOk.BadRequest(`Expected createdAt to be a Date, but was ${typeof event.createdAt}`);
  }
  return await context.withTransaction<
    unknown,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >(async (context) => {
    // Check head
    const headResult = await databaseAdapter.managementSyncGetHeadEventId(context);
    if (headResult.isError()) return headResult;

    if (event.parentId !== headResult.value) {
      return notOk.BadRequest(
        `Expected head event ID to be ${event.parentId}, but was ${headResult.value}`,
      );
    }

    return await authCreatePrincipalSyncEvent(databaseAdapter, context, event);
  });
}

export async function managementApplySyncEvent(
  schema: SchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  event: Exclude<SyncEvent, CreatePrincipalSyncEvent>,
): PromiseResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  if (!(event.createdAt instanceof Date)) {
    return notOk.BadRequest(`Expected createdAt to be a Date, but was ${typeof event.createdAt}`);
  }
  return await context.withTransaction<
    unknown,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >(async (context) => {
    // Check head
    const headResult = await databaseAdapter.managementSyncGetHeadEventId(context);
    if (headResult.isError()) return headResult;

    if (event.parentId !== headResult.value) {
      return notOk.BadRequest(
        `Expected head event ID to be ${event.parentId}, but was ${headResult.value}`,
      );
    }

    const applyResult = await applyEvent(
      schema,
      authorizationAdapter,
      databaseAdapter,
      context,
      event,
    );
    if (applyResult.isOk()) {
      return ok(applyResult.value);
    }
    if (
      applyResult.isErrorType(ErrorType.BadRequest) ||
      applyResult.isErrorType(ErrorType.Generic)
    ) {
      return applyResult;
    }
    return notOk.BadRequest(`${applyResult.error}: ${applyResult.message}`);
  });
}

function applyEvent(
  schema: SchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  event: Exclude<SyncEvent, CreatePrincipalSyncEvent>,
): PromiseResult<unknown, ErrorType> {
  const { type } = event;
  switch (type) {
    case EventType.archiveEntity:
      return adminArchiveEntitySyncEvent(databaseAdapter, authorizationAdapter, context, event);
    case EventType.createEntity:
    case EventType.createAndPublishEntity:
      return adminCreateEntitySyncEvent(
        schema,
        authorizationAdapter,
        databaseAdapter,
        context,
        event,
      );
    case EventType.publishEntities:
      return adminPublishEntitiesSyncEvent(
        schema,
        authorizationAdapter,
        databaseAdapter,
        context,
        event,
      );
    case EventType.updateEntity:
    case EventType.updateAndPublishEntity:
      return adminUpdateEntitySyncEvent(
        schema,
        authorizationAdapter,
        databaseAdapter,
        context,
        event,
      );
    case EventType.unarchiveEntity:
      return adminUnarchiveEntitySyncEvent(databaseAdapter, authorizationAdapter, context, event);
    case EventType.unpublishEntities:
      return adminUnpublishEntitiesSyncEvent(databaseAdapter, authorizationAdapter, context, event);
    case EventType.updateSchema:
      return schemaUpdateSpecificationSyncEvent(databaseAdapter, context, event);
    default:
      assertExhaustive(type);
  }
}
