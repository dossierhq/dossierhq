import { ok, type ChangelogQuery, type ErrorType, type PromiseResult } from '@dossierhq/core';
import type {
  DatabaseEventGetChangelogEventsPayload,
  DatabasePagingInfo,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { Database } from '../QueryFunctions.js';

export async function eventGetChangelogEvents(
  _database: Database,
  _context: TransactionContext,
  _query: ChangelogQuery | undefined,
  _pagingInfo: DatabasePagingInfo,
): PromiseResult<
  DatabaseEventGetChangelogEventsPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  return Promise.resolve(ok({ entities: [], hasMore: false }));
}
