import {
  assertIsDefined,
  assertOkResult,
  type ChangelogEvent,
  type Connection,
  type Edge,
  type ErrorType,
  type OkResult,
  type Result,
} from '@dossierhq/core';
import { assertEquals, assertResultValue, assertSame } from '../Asserts.js';

export function assertChangelogEventsConnection(
  actualResult: Result<
    Connection<Edge<ChangelogEvent, ErrorType>> | null,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >,
  expectedNodes: ChangelogEvent[],
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
      const createdBy: string = actualNodeResult.valueOrThrow().createdBy;
      //TODO currently we can't predict the createdBy value, so we just set it to the expected value, probably need a way to get the current subject from AdminClient
      const expectedEvent =
        expectedNode.createdBy === '' ? { ...expectedNode, createdBy } : expectedNode;
      assertResultValue(actualNodeResult, expectedEvent);
    }
  }
}
