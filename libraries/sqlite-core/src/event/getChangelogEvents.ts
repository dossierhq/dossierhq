import {
  EventType,
  assertExhaustive,
  ok,
  type ChangelogQuery,
  type ErrorType,
  type PromiseResult,
  type Result,
} from '@dossierhq/core';
import {
  createSqliteSqlQuery,
  type DatabaseEventChangelogEventPayload,
  type DatabaseEventGetChangelogEventsPayload,
  type DatabasePagingInfo,
  type SqliteQueryBuilder,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { EventsTable, SchemaVersionsTable, SubjectsTable } from '../DatabaseSchema.js';
import { queryMany, type Database, type QueryOrQueryAndValues } from '../QueryFunctions.js';
import type { ColumnValue } from '../SqliteDatabaseAdapter.js';
import { toOpaqueCursor } from '../search/OpaqueCursor.js';
import { resolvePagingCursors } from '../search/Paging.js';

export async function eventGetChangelogEvents(
  database: Database,
  context: TransactionContext,
  query: ChangelogQuery,
  paging: DatabasePagingInfo,
): PromiseResult<
  DatabaseEventGetChangelogEventsPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const sqlQueryResult = generateGetChangelogEventsQuery(database, query, paging);
  if (sqlQueryResult.isError()) return sqlQueryResult;

  const searchResult = await queryMany<EventsRow>(database, context, sqlQueryResult.value);
  if (searchResult.isError()) return searchResult;
  const rows = searchResult.value;

  const hasMore = rows.length > paging.count;
  if (hasMore) {
    rows.splice(paging.count, 1);
  }
  if (!paging.forwards) {
    // Reverse since DESC order returns the rows in the wrong order, we want them in the same order as for forwards pagination
    rows.reverse();
  }

  return ok({
    hasMore,
    edges: rows.map((it) => convertEdge(database, it)),
  });
}

type EventsRow = Pick<EventsTable, 'id' | 'type' | 'created_at'> &
  Pick<SubjectsTable, 'uuid'> &
  Partial<Pick<SchemaVersionsTable, 'version'>>;

function generateGetChangelogEventsQuery(
  database: Database,
  query: ChangelogQuery,
  paging: DatabasePagingInfo,
): Result<QueryOrQueryAndValues, typeof ErrorType.BadRequest> {
  const cursorsResult = resolvePagingCursors(database, 'int', paging);
  if (cursorsResult.isError()) return cursorsResult;
  const resolvedCursors = cursorsResult.value;

  const queryBuilder = createSqliteSqlQuery();
  const { sql } = queryBuilder;

  sql`SELECT e.id, e.type, e.created_at, s.uuid, sv.version FROM events e`;
  sql`JOIN subjects s ON e.created_by = s.id`;
  sql`LEFT JOIN schema_versions sv ON e.schema_versions_id = sv.id`; // only available on schema events
  sql`WHERE`;

  if (query.createdBy) {
    sql`AND s.uuid = ${query.createdBy}`; //TODO faster with e.created_by = (SELECT id FROM subjects WHERE uuid = ${query.createdBy})?
  }

  if ('schema' in query && query.schema) {
    sql`AND e.type = ${EventType.updateSchema}`;
  }

  // Paging 1/2
  if (resolvedCursors.after !== null) {
    const operator = query?.reverse ? '<' : '>';
    addCursorNameOperatorAndValue(
      queryBuilder,
      operator,
      paging.afterInclusive,
      resolvedCursors.after,
    );
  }
  if (resolvedCursors.before !== null) {
    const operator = query?.reverse ? '>' : '<';
    addCursorNameOperatorAndValue(
      queryBuilder,
      operator,
      paging.beforeInclusive,
      resolvedCursors.before,
    );
  }

  if (queryBuilder.query.text.endsWith('WHERE')) {
    sql`1=1`; // no-op
  }

  // Ordering
  sql`ORDER BY e.id`;
  let ascending = !query?.reverse;

  // Paging 2/2
  if (!paging.forwards) ascending = !ascending;
  const countToRequest = paging.count + 1; // request one more to calculate hasMore
  if (!ascending) sql`DESC`;
  sql`LIMIT ${countToRequest}`;

  return ok(queryBuilder.query);
}

function addCursorNameOperatorAndValue(
  queryBuilder: SqliteQueryBuilder,
  operator: '>' | '<',
  orEqual: boolean,
  value: ColumnValue,
) {
  const { sql } = queryBuilder;
  switch (operator) {
    case '>':
      if (orEqual) sql`AND e.id >=`;
      else sql`AND e.id >`;
      break;
    case '<':
      if (orEqual) sql`AND e.id <=`;
      else sql`AND e.id <`;
      break;
    default:
      assertExhaustive(operator);
  }
  sql`${value}`;
}

function convertEdge(database: Database, row: EventsRow): DatabaseEventChangelogEventPayload {
  const cursor = toOpaqueCursor(database, 'int', row.id);
  const createdBy = row.uuid;
  const createdAt = new Date(row.created_at);
  switch (row.type) {
    case EventType.updateSchema:
      return {
        cursor,
        type: EventType.updateSchema,
        createdAt,
        createdBy,
        version: row.version!,
      };
    default:
      assertExhaustive(row.type);
  }
}

export const forTest = { generateGetChangelogEventsQuery };
