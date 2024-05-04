import { ok, type ChangelogEventQuery, type ErrorType, type Result } from '@dossierhq/core';
import {
  createPostgresSqlQuery,
  type DatabasePagingInfo,
  type DatabaseResolvedEntityReference,
  type PostgresQueryBuilder,
} from '@dossierhq/database-adapter';
import type { EventsTable, SchemaVersionsTable, SubjectsTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { type QueryOrQueryAndValues } from '../QueryFunctions.js';
import {
  addConnectionOrderByAndLimit,
  addConnectionPagingFilter,
} from '../utils/ConnectionUtils.js';

export type EventsRow = Pick<EventsTable, 'id' | 'uuid' | 'type' | 'created_at'> & {
  created_by: SubjectsTable['uuid'];
} & Partial<Pick<SchemaVersionsTable, 'version'>>;

export function generateGetChangelogEventsQuery(
  database: PostgresDatabaseAdapter,
  query: ChangelogEventQuery,
  paging: DatabasePagingInfo,
  entity: DatabaseResolvedEntityReference | null,
): Result<QueryOrQueryAndValues, typeof ErrorType.BadRequest> {
  const queryBuilder = createPostgresSqlQuery();
  const { sql } = queryBuilder;

  const reverse = !!query.reverse;

  sql`SELECT e.id, e.uuid, e.type, e.created_at, s.uuid AS created_by, sv.version FROM events e`;
  sql`JOIN subjects s ON e.created_by = s.id`;
  sql`LEFT JOIN schema_versions sv ON e.schema_versions_id = sv.id`; // only available on schema events
  if (entity) {
    sql`JOIN event_entity_versions eev ON eev.events_id = e.id`;
    sql`JOIN entity_versions ev ON eev.entity_versions_id = ev.id`;
  }
  sql`WHERE`;

  addQueryFilters(queryBuilder, query, entity);

  const pagingFilterResult = addConnectionPagingFilter(
    database,
    sql,
    paging,
    'int',
    reverse,
    (sql) => sql`e.id`,
  );
  if (pagingFilterResult.isError()) return pagingFilterResult;

  addConnectionOrderByAndLimit(sql, paging, reverse, (sql) => sql`e.id`);

  return ok(queryBuilder.query);
}

export interface TotalCountRow {
  count: number;
}

export function generateGetChangelogTotalCountQuery(
  query: ChangelogEventQuery,
  entity: DatabaseResolvedEntityReference | null,
): Result<QueryOrQueryAndValues, typeof ErrorType.BadRequest> {
  const queryBuilder = createPostgresSqlQuery();
  const { sql, removeTrailingWhere } = queryBuilder;

  // Convert count to ::integer since count() is bigint (js doesn't support 64 bit numbers so pg return it as string)
  sql`SELECT COUNT(*)::integer AS count FROM events e`;
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
  { sql }: PostgresQueryBuilder,
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
    sql`AND e.type = ANY(${query.types})`;
  }
}
