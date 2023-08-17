import {
  EventType,
  ok,
  type ChangelogQuery,
  type EntityChangelogEvent,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import {
  createSqliteSqlQuery,
  type DatabaseEventChangelogEventPayload,
  type DatabaseEventGetChangelogEventsPayload,
  type DatabasePagingInfo,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type {
  EntitiesTable,
  EntityVersionsTable,
  EventEntityVersionsTable,
} from '../DatabaseSchema.js';
import { queryMany, type Database } from '../QueryFunctions.js';
import { toOpaqueCursor } from '../search/OpaqueCursor.js';
import { generateGetChangelogEventsQuery, type EventsRow } from './ChangelogQueryGenerator.js';

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
