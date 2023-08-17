import {
  EventType,
  assertExhaustive,
  ok,
  type ChangelogQuery,
  type ErrorType,
  type Result,
} from '@dossierhq/core';
import {
  createSqliteSqlQuery,
  type DatabasePagingInfo,
  type SqliteQueryBuilder,
} from '@dossierhq/database-adapter';
import type { EventsTable, SchemaVersionsTable, SubjectsTable } from '../DatabaseSchema.js';
import { type Database, type QueryOrQueryAndValues } from '../QueryFunctions.js';
import type { ColumnValue } from '../SqliteDatabaseAdapter.js';
import { resolvePagingCursors } from '../search/Paging.js';

export type EventsRow = Pick<EventsTable, 'id' | 'type' | 'created_at'> &
  Pick<SubjectsTable, 'uuid'> &
  Partial<Pick<SchemaVersionsTable, 'version'>>;

export function generateGetChangelogEventsQuery(
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

  addQueryFilters(queryBuilder, query);

  //TODO extract paging/ordering to connection function
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
    //TODO add support to sql query builder
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

export interface TotalCountRow {
  count: number;
}

export function generateGetChangelogTotalCountQuery(
  query: ChangelogQuery,
): Result<QueryOrQueryAndValues, typeof ErrorType.BadRequest> {
  const queryBuilder = createSqliteSqlQuery();
  const { sql } = queryBuilder;

  sql`SELECT COUNT(*) AS count FROM events e WHERE`;

  addQueryFilters(queryBuilder, query);

  if (queryBuilder.query.text.endsWith('WHERE')) {
    //TODO add support to sql query builder
    sql`1=1`; // no-op
  }

  return ok(queryBuilder.query);
}

function addQueryFilters({ sql }: SqliteQueryBuilder, query: ChangelogQuery) {
  if (query.createdBy) {
    sql`AND s.uuid = ${query.createdBy}`; //TODO faster with e.created_by = (SELECT id FROM subjects WHERE uuid = ${query.createdBy})?
  }

  if ('schema' in query && query.schema) {
    sql`AND e.type = ${EventType.updateSchema}`;
  }
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
