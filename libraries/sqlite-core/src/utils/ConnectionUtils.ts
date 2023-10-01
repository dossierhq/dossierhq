import { assertExhaustive, ok, type ErrorType, type Result } from '@dossierhq/core';
import type {
  DatabaseConnectionPayload,
  DatabasePagingInfo,
  SqliteSqlTemplateTag,
} from '@dossierhq/database-adapter';
import type { Database } from '../QueryFunctions.js';
import type { ColumnValue } from '../SqliteDatabaseAdapter.js';
import type { CursorNativeType } from '../search/OpaqueCursor.js';
import { resolvePagingCursors } from '../search/Paging.js';

export function addConnectionPagingFilter(
  database: Database,
  sql: SqliteSqlTemplateTag,
  paging: DatabasePagingInfo,
  cursorType: CursorNativeType,
  reverse: boolean,
  addPagingColumns: (sql: SqliteSqlTemplateTag) => void,
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
  sql: SqliteSqlTemplateTag,
  operator: '>' | '<',
  orEqual: boolean,
  value: ColumnValue,
  addPagingColumns: (sql: SqliteSqlTemplateTag) => void,
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
  sql: SqliteSqlTemplateTag,
  paging: DatabasePagingInfo,
  reverse: boolean,
  addPagingColumns: (sql: SqliteSqlTemplateTag) => void,
): void {
  sql`ORDER BY`;
  addPagingColumns(sql);

  let ascending = !reverse;
  if (!paging.forwards) ascending = !ascending;

  const countToRequest = paging.count + 1; // request one more to calculate hasMore
  if (!ascending) sql`DESC`;
  sql`LIMIT ${countToRequest}`;
}

export function convertConnectionPayload<
  TRow,
  TEdge extends {
    cursor: string;
  },
>(
  database: Database,
  paging: DatabasePagingInfo,
  rows: TRow[],
  convertEdge: (database: Database, row: TRow) => TEdge,
): DatabaseConnectionPayload<TEdge> {
  const hasMore = rows.length > paging.count;
  if (hasMore) {
    rows.splice(paging.count, 1);
  }
  if (!paging.forwards) {
    // Reverse since DESC order returns the rows in the wrong order, we want them in the same order as for forwards pagination
    rows.reverse();
  }

  return {
    hasMore,
    edges: rows.map((row) => convertEdge(database, row)),
  };
}
