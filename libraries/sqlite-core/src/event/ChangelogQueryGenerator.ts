import {
  assertExhaustive,
  ok,
  type ChangelogEventQuery,
  type ErrorType,
  type Result,
} from '@dossierhq/core';
import type { DatabaseResolvedEntityReference } from '@dossierhq/database-adapter';
import {
  createSqliteSqlQuery,
  type DatabasePagingInfo,
  type SqliteQueryBuilder,
} from '@dossierhq/database-adapter';
import type { EventsTable, SchemaVersionsTable, SubjectsTable } from '../DatabaseSchema.js';
import { type Database, type QueryOrQueryAndValues } from '../QueryFunctions.js';
import type { ColumnValue } from '../SqliteDatabaseAdapter.js';
import { resolvePagingCursors } from '../search/Paging.js';

export type EventsRow = Pick<EventsTable, 'id' | 'uuid' | 'type' | 'created_at'> & {
  created_by: SubjectsTable['uuid'];
} & Partial<Pick<SchemaVersionsTable, 'version'>>;

export function generateGetChangelogEventsQuery(
  database: Database,
  query: ChangelogEventQuery,
  paging: DatabasePagingInfo,
  entity: DatabaseResolvedEntityReference | null,
): Result<QueryOrQueryAndValues, typeof ErrorType.BadRequest> {
  const cursorsResult = resolvePagingCursors(database, 'int', paging);
  if (cursorsResult.isError()) return cursorsResult;
  const resolvedCursors = cursorsResult.value;

  const queryBuilder = createSqliteSqlQuery();
  const { sql } = queryBuilder;

  sql`SELECT e.id, e.uuid, e.type, e.created_at, s.uuid AS created_by, sv.version FROM events e`;
  sql`JOIN subjects s ON e.created_by = s.id`;
  sql`LEFT JOIN schema_versions sv ON e.schema_versions_id = sv.id`; // only available on schema events
  if (entity) {
    sql`JOIN event_entity_versions eev ON eev.events_id = e.id`;
    sql`JOIN entity_versions ev ON eev.entity_versions_id = ev.id`;
  }
  sql`WHERE`;

  addQueryFilters(queryBuilder, query, entity);

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
  query: ChangelogEventQuery,
  entity: DatabaseResolvedEntityReference | null,
): Result<QueryOrQueryAndValues, typeof ErrorType.BadRequest> {
  const queryBuilder = createSqliteSqlQuery();
  const { sql, removeTrailingWhere } = queryBuilder;

  sql`SELECT COUNT(*) AS count FROM events e`;
  if (entity) {
    sql`JOIN event_entity_versions eev ON eev.events_id = e.id`;
    sql`JOIN entity_versions ev ON eev.entity_versions_id = ev.id`;
  }
  sql`WHERE`;

  addQueryFilters(queryBuilder, query, entity);

  removeTrailingWhere();

  return ok(queryBuilder.query);
}

function addQueryFilters(
  { sql, addValueList }: SqliteQueryBuilder,
  query: ChangelogEventQuery,
  entity: DatabaseResolvedEntityReference | null,
) {
  if (query.createdBy) {
    sql`AND e.created_by = (SELECT id FROM subjects WHERE uuid = ${query.createdBy})`;
  }

  if (entity) {
    sql`AND ev.entities_id = ${entity.entityInternalId as number}`;
  }

  if (query.types && query.types.length > 0) {
    sql`AND e.type IN ${addValueList(query.types)}`;
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
