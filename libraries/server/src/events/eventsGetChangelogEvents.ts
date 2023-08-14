import {
  ok,
  type ChangelogEvent,
  type ChangelogQuery,
  type Connection,
  type Edge,
  type ErrorType,
  type Paging,
  type PromiseResult,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';

export async function eventsGetChangelogEvents(
  _authorizationAdapter: AuthorizationAdapter,
  _databaseAdapter: DatabaseAdapter,
  _context: SessionContext,
  _query: ChangelogQuery | undefined,
  _paging: Paging | undefined,
): PromiseResult<
  Connection<Edge<ChangelogEvent, typeof ErrorType.Generic>> | null,
  typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  return Promise.resolve(ok(null));
}
