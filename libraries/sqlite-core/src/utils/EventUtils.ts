import {
  EventType,
  ok,
  type ErrorType,
  type EntityChangelogEvent,
  type PromiseResult,
} from '@dossierhq/core';
import {
  buildSqliteSqlQuery,
  type Session,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { EventsTable } from '../DatabaseSchema.js';
import { queryOne, queryRun, type Database } from '../QueryFunctions.js';
import { getSessionSubjectInternalId } from './SessionUtils.js';

export async function createEntityEvent(
  database: Database,
  context: TransactionContext,
  session: Session,
  now: string,
  eventType: EntityChangelogEvent['type'],
  entityVersions: { entityVersionsId: number; entityType: string }[],
): PromiseResult<void, typeof ErrorType.Generic> {
  const createdBy = getSessionSubjectInternalId(session);
  const eventResult = await queryOne<Pick<EventsTable, 'id'>>(
    database,
    context,
    buildSqliteSqlQuery(({ sql }) => {
      sql`INSERT INTO events (type, created_by, created_at)`;
      sql`VALUES (${eventType}, ${createdBy}, ${now}) RETURNING id`;
    }),
  );
  if (eventResult.isError()) return eventResult;
  const eventsId = eventResult.value.id;

  const entitiesResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(({ sql }) => {
      sql`INSERT INTO event_entity_versions (events_id, entity_versions_id, entity_type) VALUES`;
      for (const { entityVersionsId, entityType } of entityVersions) {
        sql`(${eventsId}, ${entityVersionsId}, ${entityType})`;
      }
    }),
  );
  if (entitiesResult.isError()) return entitiesResult;

  return ok(undefined);
}

export async function createUpdateSchemaEvent(
  database: Database,
  context: TransactionContext,
  session: Session,
  now: string,
  schemaVersionId: number,
): PromiseResult<undefined, typeof ErrorType.Generic> {
  const createdBy = getSessionSubjectInternalId(session);
  const result = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(({ sql }) => {
      sql`INSERT INTO events (type, created_by, created_at, schema_versions_id)`;
      sql`VALUES (${EventType.updateSchema}, ${createdBy}, ${now}, ${schemaVersionId})`;
    }),
  );
  if (result.isError()) return result;
  return ok(undefined);
}
