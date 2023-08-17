import { ok, type ChangelogQuery, type ErrorType, type PromiseResult } from '@dossierhq/core';
import type {
  DatabaseEventGetChangelogEventsPayload,
  DatabasePagingInfo,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';

export async function eventGetChangelogEvents(
  _databaseAdapter: PostgresDatabaseAdapter,
  _context: TransactionContext,
  _query: ChangelogQuery,
  _pagingInfo: DatabasePagingInfo,
): PromiseResult<
  DatabaseEventGetChangelogEventsPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  //TODO implement
  return Promise.resolve(ok({ edges: [], hasMore: false }));
}

export async function eventGetChangelogEventsTotalCount(
  _databaseAdapter: PostgresDatabaseAdapter,
  _context: TransactionContext,
  _query: ChangelogQuery,
): PromiseResult<number, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  //TODO implement
  return Promise.resolve(ok(0));
}
