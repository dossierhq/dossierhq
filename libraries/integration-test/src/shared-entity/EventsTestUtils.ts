import {
  assertIsDefined,
  assertOkResult,
  type ChangelogEvent,
  type Connection,
  type Edge,
  type EntityChangelogEvent,
  type ErrorType,
  type OkResult,
  type Result,
  type SchemaChangelogEvent,
} from '@dossierhq/core';
import { assertEquals, assertSame } from '../Asserts.js';

type ChangelogEventWithoutId = Omit<SchemaChangelogEvent, 'id'> | Omit<EntityChangelogEvent, 'id'>;

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
    assertIsDefined(actualResult.value);
    assertEquals(actualResult.value.edges.length, expectedNodes.length);
    for (const [index, expectedNode] of expectedNodes.entries()) {
      const actualNodeResult: Result<ChangelogEvent, ErrorType> =
        actualResult.value.edges[index].node;
      // Skip id since it's random
      const { id, ...actualEvent } = actualNodeResult.valueOrThrow();

      const createdBy: string = actualEvent.createdBy;
      //TODO currently we can't predict the createdBy value, so we just set it to the expected value, probably need a way to get the current subject from AdminClient
      const expectedEvent =
        expectedNode.createdBy === '' ? { ...expectedNode, createdBy } : expectedNode;

      assertEquals(actualEvent, expectedEvent);
    }
  }
}
