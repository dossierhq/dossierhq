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
import { fetchAndDecodeConnection } from '../utils/fetchAndDecodeConnection.js';

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
  return fetchAndDecodeConnection(
    paging,
    (pagingInfo) => databaseAdapter.eventGetChangelogEvents(context, query ?? {}, pagingInfo),
    decodeChangelogEvent,
  );
}

function decodeChangelogEvent(
  changelogEvent: DatabaseEventChangelogEventPayload,
): Result<ChangelogEvent, typeof ErrorType.Generic> {
  const { cursor, ...event } = changelogEvent;
  return ok(event);
}
