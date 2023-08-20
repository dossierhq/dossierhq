import {
  EventType,
  ok,
  type EntityChangelogEvent,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import {
  buildPostgresSqlQuery,
  type Session,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { EventsTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryOne, queryRun } from '../QueryFunctions.js';
import { getSessionSubjectInternalId } from './SessionUtils.js';

export async function createEntityEvent(
  database: PostgresDatabaseAdapter,
  context: TransactionContext,
  session: Session,
  eventType: EntityChangelogEvent['type'],
  entityVersions: { entityVersionsId: number }[],
): PromiseResult<void, typeof ErrorType.Generic> {
  const createdBy = getSessionSubjectInternalId(session);
  const eventResult = await queryOne<Pick<EventsTable, 'id'>>(
    database,
    context,
    buildPostgresSqlQuery(({ sql }) => {
      sql`INSERT INTO events (type, created_by)`;
      sql`VALUES (${eventType}, ${createdBy}) RETURNING id`;
    }),
  );
  if (eventResult.isError()) return eventResult;
  const eventsId = eventResult.value.id;

  const entitiesResult = await queryRun(
    database,
    context,
    buildPostgresSqlQuery(({ sql, addValue }) => {
      sql`INSERT INTO event_entity_versions (events_id, entity_versions_id) VALUES`;
      const eventsValue = addValue(eventsId);
      for (const { entityVersionsId } of entityVersions) {
        sql`(${eventsValue}, ${entityVersionsId})`;
      }
    }),
  );
  if (entitiesResult.isError()) return entitiesResult;

  return ok(undefined);
}

export async function createUpdateSchemaEvent(
  database: PostgresDatabaseAdapter,
  context: TransactionContext,
  session: Session,
  schemaVersionId: number,
): PromiseResult<undefined, typeof ErrorType.Generic> {
  const createdBy = getSessionSubjectInternalId(session);
  const result = await queryRun(
    database,
    context,
    buildPostgresSqlQuery(({ sql }) => {
      sql`INSERT INTO events (type, created_by, schema_versions_id)`;
      sql`VALUES (${EventType.updateSchema}, ${createdBy}, ${schemaVersionId})`;
    }),
  );
  if (result.isError()) return result;
  return ok(undefined);
}
