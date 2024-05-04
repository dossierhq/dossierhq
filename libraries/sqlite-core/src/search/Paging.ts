import { ok, type ErrorType, type Result } from '@dossierhq/core';
import type { DatabasePagingInfo } from '@dossierhq/database-adapter';
import type { Database } from '../QueryFunctions.js';
import type { ColumnValue } from '../SqliteDatabaseAdapter.js';
import { fromOpaqueCursor, type CursorNativeType } from './OpaqueCursor.js';

export interface ResolvedPagingCursors<TCursor extends ColumnValue> {
  before: TCursor | null;
  after: TCursor | null;
}

function getCursor(
  database: Database,
  cursorType: CursorNativeType,
  paging: DatabasePagingInfo,
  key: 'after' | 'before',
): Result<unknown, typeof ErrorType.BadRequest> {
  const cursor = paging[key];
  if (cursor) {
    return fromOpaqueCursor(database, cursorType, cursor);
  }
  return ok(null);
}

export function resolvePagingCursors<TCursor extends ColumnValue>(
  database: Database,
  cursorType: CursorNativeType,
  paging: DatabasePagingInfo,
): Result<ResolvedPagingCursors<TCursor>, typeof ErrorType.BadRequest> {
  const after = getCursor(database, cursorType, paging, 'after');
  const before = getCursor(database, cursorType, paging, 'before');

  if (after.isError()) return after;
  if (before.isError()) return before;

  return ok({
    before: before.value as TCursor,
    after: after.value as TCursor,
  });
}
