import {
  ErrorType,
  EventType,
  notOk,
  ok,
  type AdminSchemaWithMigrations,
  type PromiseResult,
  type SyncEvent,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { adminCreateEntitySyncEvent } from '../admin-entity/adminCreateEntity.js';
import { adminPublishEntitiesSyncEvent } from '../admin-entity/adminPublishEntities.js';
import { adminUpdateEntitySyncEvent } from '../admin-entity/adminUpdateEntity.js';
import { schemaUpdateSpecificationSyncAction } from '../schema/schemaUpdateSpecification.js';

export async function managementApplySyncEvent(
  adminSchema: AdminSchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  expectedHeadId: string | null,
  event: SyncEvent,
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

    if (expectedHeadId !== headResult.value) {
      return notOk.BadRequest(
        `Expected head event ID to be ${expectedHeadId}, but was ${headResult.value}`,
      );
    }

    const applyResult = await applyEvent(
      adminSchema,
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

async function applyEvent(
  adminSchema: AdminSchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  event: SyncEvent,
): PromiseResult<unknown, ErrorType> {
  const { type } = event;
  switch (type) {
    case EventType.createEntity:
    case EventType.createAndPublishEntity:
      return await adminCreateEntitySyncEvent(
        adminSchema,
        authorizationAdapter,
        databaseAdapter,
        context,
        event,
      );
    case EventType.publishEntities:
      return await adminPublishEntitiesSyncEvent(
        adminSchema,
        authorizationAdapter,
        databaseAdapter,
        context,
        event,
      );
    case EventType.updateEntity:
    case EventType.updateAndPublishEntity:
      return adminUpdateEntitySyncEvent(
        adminSchema,
        authorizationAdapter,
        databaseAdapter,
        context,
        event,
      );
    case EventType.updateSchema:
      return await schemaUpdateSpecificationSyncAction(databaseAdapter, context, event);
    default:
      return notOk.BadRequest(`Unsupported event type: ${type}`);
  }
}
