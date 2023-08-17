import {
  notOk,
  ok,
  type ChangelogQuery,
  type EntityReference,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabaseEventGetChangelogEventsPayload,
  DatabasePagingInfo,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';

export async function eventGetChangelogEvents(
  _databaseAdapter: PostgresDatabaseAdapter,
  _context: TransactionContext,
  _query: ChangelogQuery,
  _pagingInfo: DatabasePagingInfo,
  _entity: DatabaseResolvedEntityReference | null,
): PromiseResult<
  DatabaseEventGetChangelogEventsPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  //TODO implement
  return Promise.resolve(ok({ edges: [], hasMore: false }));
}

export function eventGetChangelogEventsEntityInfo(
  _databaseAdapter: PostgresDatabaseAdapter,
  _context: TransactionContext,
  _entity: EntityReference,
): ReturnType<DatabaseAdapter['eventGetChangelogEventsEntityInfo']> {
  return Promise.resolve(notOk.Generic('TODO'));
}

export async function eventGetChangelogEventsTotalCount(
  _databaseAdapter: PostgresDatabaseAdapter,
  _context: TransactionContext,
  _query: ChangelogQuery,
  _entity: DatabaseResolvedEntityReference | null,
): PromiseResult<number, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  //TODO implement
  return Promise.resolve(ok(0));
}
