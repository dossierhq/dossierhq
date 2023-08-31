import {
  EventType,
  ok,
  type ChangelogEventQuery,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import {
  createPostgresSqlQuery,
  type DatabaseEventChangelogEntityEventPayload,
  type DatabaseEventChangelogEventPayload,
  type DatabaseEventGetChangelogEventsPayload,
  type DatabasePagingInfo,
  type DatabaseResolvedEntityReference,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type {
  EntitiesTable,
  EntityVersionsTable,
  EventEntityVersionsTable,
} from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryMany } from '../QueryFunctions.js';
import { toOpaqueCursor } from '../search/OpaqueCursor.js';
import { generateGetChangelogEventsQuery, type EventsRow } from './ChangelogQueryGenerator.js';

export async function eventGetChangelogEvents(
  database: PostgresDatabaseAdapter,
  context: TransactionContext,
  query: ChangelogEventQuery,
  paging: DatabasePagingInfo,
  entity: DatabaseResolvedEntityReference | null,
): PromiseResult<
  DatabaseEventGetChangelogEventsPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const sqlQueryResult = generateGetChangelogEventsQuery(database, query, paging, entity);
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

type EntityInfoRow = Pick<EventEntityVersionsTable, 'events_id'> &
  Pick<EntitiesTable, 'uuid' | 'auth_key' | 'resolved_auth_key'> &
  Pick<EntityVersionsTable, 'type' | 'name' | 'version'>;

async function getEntityInfoForEvents(
  database: PostgresDatabaseAdapter,
  context: TransactionContext,
  events: EventsRow[],
): PromiseResult<EntityInfoRow[], typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const entityEventIds = events
    .filter((it) => it.type !== EventType.updateSchema)
    .map((it) => it.id);

  if (entityEventIds.length === 0) {
    return ok([]);
  }

  const { sql, query } = createPostgresSqlQuery();
  sql`SELECT eev.events_id, e.uuid, e.auth_key, e.resolved_auth_key, ev.type, ev.name, ev.version FROM event_entity_versions eev`;
  sql`JOIN entity_versions ev ON eev.entity_versions_id = ev.id`;
  sql`JOIN entities e ON ev.entities_id = e.id`;
  sql`WHERE eev.events_id = ANY(${entityEventIds})`;

  return queryMany<EntityInfoRow>(database, context, query);
}

function convertEdge(
  database: PostgresDatabaseAdapter,
  entityRows: EntityInfoRow[],
  row: EventsRow,
): DatabaseEventChangelogEventPayload {
  const cursor = toOpaqueCursor(database, 'int', row.id);
  const id = row.uuid;
  const createdBy = row.created_by;
  const createdAt = new Date(row.created_at);
  switch (row.type) {
    case EventType.updateSchema:
      return {
        cursor,
        id,
        type: EventType.updateSchema,
        createdAt,
        createdBy,
        version: row.version!,
      };
    default: {
      const entities: DatabaseEventChangelogEntityEventPayload['entities'] = [];
      for (const entityRow of entityRows) {
        if (entityRow.events_id === row.id) {
          entities.push({
            id: entityRow.uuid,
            name: entityRow.name,
            version: entityRow.version,
            type: entityRow.type,
            authKey: entityRow.auth_key,
            resolvedAuthKey: entityRow.resolved_auth_key,
          });
        }
      }

      return { cursor, id, type: row.type, createdAt, createdBy, entities };
    }
  }
}
