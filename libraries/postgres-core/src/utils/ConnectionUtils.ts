import { ok, type ErrorType, type Result } from '@dossierhq/core';
import type { DatabasePagingInfo, PostgresSqlTemplateTag } from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import type { CursorNativeType } from '../search/OpaqueCursor.js';
import { resolvePagingCursors } from '../search/Paging.js';
import { assertExhaustive } from './AssertUtils.js';

export function addConnectionPagingFilter(
  database: PostgresDatabaseAdapter,
  sql: PostgresSqlTemplateTag,
  paging: DatabasePagingInfo,
  cursorType: CursorNativeType,
  reverse: boolean,
  addPagingColumns: (sql: PostgresSqlTemplateTag) => void,
): Result<void, typeof ErrorType.BadRequest> {
  const cursorsResult = resolvePagingCursors(database, cursorType, paging);
  if (cursorsResult.isError()) return cursorsResult;
  const resolvedCursors = cursorsResult.value;

  if (resolvedCursors.after !== null) {
    const operator = reverse ? '<' : '>';
    addCursorNameOperatorAndValue(
      sql,
      operator,
      paging.afterInclusive,
      resolvedCursors.after,
      addPagingColumns,
    );
  }
  if (resolvedCursors.before !== null) {
    const operator = reverse ? '>' : '<';
    addCursorNameOperatorAndValue(
      sql,
      operator,
      paging.beforeInclusive,
      resolvedCursors.before,
      addPagingColumns,
    );
  }

  return ok(undefined);
}

function addCursorNameOperatorAndValue(
  sql: PostgresSqlTemplateTag,
  operator: '>' | '<',
  orEqual: boolean,
  value: unknown,
  addPagingColumns: (sql: PostgresSqlTemplateTag) => void,
) {
  sql`AND `;
  addPagingColumns(sql);
  switch (operator) {
    case '>':
      if (orEqual) sql`>=`;
      else sql`>`;
      break;
    case '<':
      if (orEqual) sql`<=`;
      else sql`<`;
      break;
    default:
      assertExhaustive(operator);
  }
  sql`${value}`;
}

export function addConnectionOrderByAndLimit(
  sql: PostgresSqlTemplateTag,
  paging: DatabasePagingInfo,
  reverse: boolean,
  addPagingColumns: (sql: PostgresSqlTemplateTag) => void,
): void {
  sql`ORDER BY`;
  addPagingColumns(sql);

  let ascending = !reverse;
  if (!paging.forwards) ascending = !ascending;

  const countToRequest = paging.count + 1; // request one more to calculate hasMore
  if (!ascending) sql`DESC`;
  sql`LIMIT ${countToRequest}`;
}

export function resolveConnectionPagingAndOrdering<TRow>(
  paging: DatabasePagingInfo,
  rows: TRow[],
): { hasMore: boolean; edges: TRow[] } {
  const hasMore = rows.length > paging.count;
  const edges = [...rows];
  if (hasMore) {
    edges.splice(paging.count, 1);
  }
  if (!paging.forwards) {
    // Reverse since DESC order returns the rows in the wrong order, we want them in the same order as for forwards pagination
    edges.reverse();
  }
  return { hasMore, edges };
}
