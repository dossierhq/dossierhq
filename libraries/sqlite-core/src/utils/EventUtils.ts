/* eslint-disable @typescript-eslint/no-unused-expressions */
import {
  EventType,
  ok,
  type CreatePrincipalSyncEvent,
  type EntityChangelogEvent,
  type ErrorType,
  type PromiseResult,
  type SyncEvent,
  type UpdateSchemaSyncEvent,
} from '@dossierhq/core';
import {
  buildSqliteSqlQuery,
  type Session,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { EventsTable } from '../DatabaseSchema.js';
import { queryOne, queryRun, type Database } from '../QueryFunctions.js';
import { getTransactionTimestamp } from '../SqliteTransaction.js';
import { getSessionSubjectInternalId } from './SessionUtils.js';

export async function createEntityEvent(
  database: Database,
  context: TransactionContext,
  session: Session,
  eventType: EntityChangelogEvent['type'],
  entityVersions: { entityVersionsId: number; publishedName?: string }[],
  syncEvent: Exclude<Exclude<SyncEvent, UpdateSchemaSyncEvent>, CreatePrincipalSyncEvent> | null,
): PromiseResult<void, typeof ErrorType.Generic> {
  const now = (
    syncEvent ? syncEvent.createdAt : getTransactionTimestamp(context.transaction)
  ).toISOString();
  const uuid = syncEvent ? syncEvent.id : database.adapter.randomUUID();
  const createdBy = getSessionSubjectInternalId(session);
  const eventResult = await queryOne<Pick<EventsTable, 'id'>>(
    database,
    context,
    buildSqliteSqlQuery(({ sql }) => {
      sql`INSERT INTO events (uuid, type, created_by, created_at)`;
      sql`VALUES (${uuid}, ${eventType}, ${createdBy}, ${now}) RETURNING id`;
    }),
  );
  if (eventResult.isError()) return eventResult;
  const eventsId = eventResult.value.id;

  const entitiesResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(({ sql, addValue }) => {
      sql`INSERT INTO event_entity_versions (events_id, entity_versions_id, published_name) VALUES`;
      const eventsValue = addValue(eventsId);
      for (const { entityVersionsId, publishedName } of entityVersions) {
        sql`, (${eventsValue}, ${entityVersionsId}, ${publishedName ?? null} )`;
      }
    }),
  );
  if (entitiesResult.isError()) return entitiesResult;

  return ok(undefined);
}

export async function createCreatePrincipalEvent(
  database: Database,
  context: TransactionContext,
  subjectInternalId: number,
  principalInternalId: number,
  syncEvent: CreatePrincipalSyncEvent | null,
): PromiseResult<void, typeof ErrorType.Generic> {
  const now = (
    syncEvent ? syncEvent.createdAt : getTransactionTimestamp(context.transaction)
  ).toISOString();
  const uuid = syncEvent ? syncEvent.id : database.adapter.randomUUID();
  const result = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(({ sql }) => {
      sql`INSERT INTO events (uuid, type, created_by, created_at, principals_id)`;
      sql`VALUES (${uuid}, ${EventType.createPrincipal}, ${subjectInternalId}, ${now}, ${principalInternalId})`;
    }),
  );
  if (result.isError()) return result;
  return ok(undefined);
}

export async function createUpdateSchemaEvent(
  database: Database,
  context: TransactionContext,
  session: Session,
  schemaVersionId: number,
  syncEvent: UpdateSchemaSyncEvent | null,
): PromiseResult<void, typeof ErrorType.Generic> {
  const now = (
    syncEvent ? syncEvent.createdAt : getTransactionTimestamp(context.transaction)
  ).toISOString();
  const uuid = syncEvent ? syncEvent.id : database.adapter.randomUUID();
  const createdBy = getSessionSubjectInternalId(session);
  const result = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(({ sql }) => {
      sql`INSERT INTO events (uuid, type, created_by, created_at, schema_versions_id)`;
      sql`VALUES (${uuid}, ${EventType.updateSchema}, ${createdBy}, ${now}, ${schemaVersionId})`;
    }),
  );
  if (result.isError()) return result;
  return ok(undefined);
}
