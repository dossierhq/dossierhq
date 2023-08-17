import {
  EventType,
  assertExhaustive,
  ok,
  type ChangelogQuery,
  type EntityChangelogEvent,
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
import type {
  EntitiesTable,
  EntityVersionsTable,
  EventEntityVersionsTable,
  EventsTable,
  SchemaVersionsTable,
  SubjectsTable,
} from '../DatabaseSchema.js';
import {
  queryMany,
  type Database,
  type QueryOrQueryAndValues,
  queryOne,
} from '../QueryFunctions.js';
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

  const entitiesInfoResult = await getEntityInfoForEvents(database, context, rows);
  if (entitiesInfoResult.isError()) return entitiesInfoResult;

  return ok({
    hasMore,
    edges: rows.map((it) => convertEdge(database, entitiesInfoResult.value, it)),
  });
}

export async function eventGetChangelogTotalCount(
  database: Database,
  context: TransactionContext,
  query: ChangelogQuery,
): PromiseResult<number, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const sqlQueryResult = generateGetChangelogTotalCountQuery(query);
  if (sqlQueryResult.isError()) return sqlQueryResult;

  const totalResult = await queryOne<TotalCountRow>(database, context, sqlQueryResult.value);
  if (totalResult.isError()) return totalResult;

  return ok(totalResult.value.count);
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

  addQueryFilters(queryBuilder, query);

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

interface TotalCountRow {
  count: number;
}

function generateGetChangelogTotalCountQuery(
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

type EntityInfoRow = Pick<EventEntityVersionsTable, 'events_id' | 'entity_type'> &
  Pick<EntitiesTable, 'uuid' | 'name'> &
  Pick<EntityVersionsTable, 'version'>;

async function getEntityInfoForEvents(
  database: Database,
  context: TransactionContext,
  events: EventsRow[],
): PromiseResult<EntityInfoRow[], typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  if (events.length === 0) {
    return ok([]);
  }

  let startId = events[0].id;
  let endId = events[events.length - 1].id;
  if (endId < startId) {
    const temp = startId;
    startId = endId;
    endId = temp;
  }

  const { sql, query } = createSqliteSqlQuery();
  sql`SELECT eev.events_id, eev.entity_type, e.uuid, e.name, ev.version FROM event_entity_versions eev`;
  sql`JOIN entity_versions ev ON eev.entity_versions_id = ev.id`;
  sql`JOIN entities e ON ev.entities_id = e.id`;
  sql`WHERE eev.events_id >= ${startId} AND eev.events_id <= ${endId} ORDER BY eev.events_id`;

  return queryMany<EntityInfoRow>(database, context, query);
}

function convertEdge(
  database: Database,
  entityRows: EntityInfoRow[],
  row: EventsRow,
): DatabaseEventChangelogEventPayload {
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
    default: {
      const entities: EntityChangelogEvent['entities'] = [];
      for (const entityRow of entityRows) {
        if (entityRow.events_id === row.id) {
          entities.push({
            id: entityRow.uuid,
            name: entityRow.name,
            version: entityRow.version,
            type: entityRow.entity_type,
          });
        }
      }

      return { cursor, type: row.type, createdAt, createdBy, entities };
    }
  }
}

export const forTest = { generateGetChangelogEventsQuery };
