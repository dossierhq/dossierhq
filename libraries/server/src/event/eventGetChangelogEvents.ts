import {
  ok,
  type ChangelogEvent,
  type ChangelogQuery,
  type Connection,
  type Edge,
  type ErrorType,
  type Paging,
  type PromiseResult,
  type Result,
} from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabaseEventChangelogEventPayload,
} from '@dossierhq/database-adapter';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import {
  getOppositeDirectionPaging,
  resolveConnectionPayload,
  resolvePagingInfo,
} from '../shared-entity/sharedSearchEntities.js';

export async function eventGetChangelogEvents(
  _authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: ChangelogQuery | undefined,
  paging: Paging | undefined,
): PromiseResult<
  Connection<Edge<ChangelogEvent, typeof ErrorType.Generic>> | null,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  const pagingResult = resolvePagingInfo(paging);
  if (pagingResult.isError()) return pagingResult;
  const pagingInfo = pagingResult.value;

  const searchResult = await databaseAdapter.eventGetChangelogEvents(context, query, pagingInfo);
  if (searchResult.isError()) return searchResult;

  let hasMoreOppositeDirection = false;
  const oppositePagingInfo = getOppositeDirectionPaging(pagingInfo, searchResult.value);
  if (oppositePagingInfo) {
    const oppositeResult = await databaseAdapter.eventGetChangelogEvents(
      context,
      query,
      oppositePagingInfo,
    );
    if (oppositeResult.isError()) return oppositeResult;
    hasMoreOppositeDirection = oppositeResult.value.hasMore;
  }

  return resolveConnectionPayload(
    pagingInfo,
    searchResult.value,
    hasMoreOppositeDirection,
    decodeChangelogEvent,
  );
}

function decodeChangelogEvent(
  changelogEvent: DatabaseEventChangelogEventPayload,
): Result<ChangelogEvent, typeof ErrorType.Generic> {
  const { cursor, ...event } = changelogEvent;
  return ok(event);
}
