import {
  assertOkResult,
  type ArchiveEntitySyncEvent,
  type ChangelogEvent,
  type Connection,
  type CreateEntitySyncEvent,
  type CreatePrincipalSyncEvent,
  type DeleteEntitySyncEvent,
  type Edge,
  type EntityChangelogEvent,
  type ErrorType,
  type OkResult,
  type PublishEntitiesSyncEvent,
  type Result,
  type SchemaChangelogEvent,
  type SyncEvent,
  type UnarchiveEntitySyncEvent,
  type UnpublishEntitiesSyncEvent,
  type UpdateEntitySyncEvent,
  type UpdateSchemaSyncEvent,
} from '@dossierhq/core';
import { assertEquals, assertSame, assertTruthy } from '../Asserts.js';

type ChangelogEventWithoutId = Omit<SchemaChangelogEvent, 'id'> | Omit<EntityChangelogEvent, 'id'>;

type WithCreatedAt<T extends SyncEvent> = Omit<T, 'id' | 'createdAt'>;

type SyncEventWithoutIdAndCreatedAt =
  | WithCreatedAt<CreatePrincipalSyncEvent>
  | WithCreatedAt<DeleteEntitySyncEvent>
  | WithCreatedAt<UpdateSchemaSyncEvent>
  | WithCreatedAt<CreateEntitySyncEvent>
  | WithCreatedAt<UpdateEntitySyncEvent>
  | WithCreatedAt<PublishEntitiesSyncEvent>
  | WithCreatedAt<UnpublishEntitiesSyncEvent>
  | WithCreatedAt<ArchiveEntitySyncEvent>
  | WithCreatedAt<UnarchiveEntitySyncEvent>;

export function assertChangelogEventsConnection(
  actualResult: Result<
    Connection<Edge<ChangelogEvent, ErrorType>> | null,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >,
  expectedNodes: ChangelogEventWithoutId[],
): asserts actualResult is OkResult<
  Connection<Edge<ChangelogEvent, ErrorType>> | null,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  assertOkResult(actualResult);
  if (expectedNodes.length === 0) {
    assertSame(actualResult.value, null);
  } else {
    assertTruthy(actualResult.value);
    assertEquals(actualResult.value.edges.length, expectedNodes.length);
    for (const [index, expectedNode] of expectedNodes.entries()) {
      const actualNodeResult: Result<ChangelogEvent, ErrorType> =
        actualResult.value.edges[index].node;
      // Skip id since it's random
      const { id, ...actualEvent } = actualNodeResult.valueOrThrow();

      const createdBy: string = actualEvent.createdBy;
      //TODO currently we can't predict the createdBy value, so we just set it to the expected value, probably need a way to get the current subject from DossierClient
      const expectedEvent =
        expectedNode.createdBy === '' ? { ...expectedNode, createdBy } : expectedNode;

      assertEquals(actualEvent, expectedEvent);
    }
  }
}

export function assertSyncEventsEqual(
  actualEvents: SyncEvent[],
  expectedEvents: SyncEventWithoutIdAndCreatedAt[],
) {
  assertEquals(actualEvents.length, expectedEvents.length);
  for (let i = 0; i < actualEvents.length; i++) {
    const { id, createdAt, ...actualEvent } = actualEvents[i];
    assertEquals(actualEvent, expectedEvents[i]);
  }
}
