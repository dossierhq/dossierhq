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
  DEFAULT,
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
  entityVersions: { entityVersionsId: number; publishedName?: string }[],
  syncEvent: Exclude<Exclude<SyncEvent, UpdateSchemaSyncEvent>, CreatePrincipalSyncEvent> | null,
): PromiseResult<void, typeof ErrorType.Generic> {
  const createdBy = getSessionSubjectInternalId(session);
  const eventResult = await queryOne<Pick<EventsTable, 'id'>>(
    database,
    context,
    buildPostgresSqlQuery(({ sql }) => {
      const uuid = syncEvent?.id ?? DEFAULT;
      const createdAt = syncEvent?.createdAt ?? DEFAULT;
      sql`INSERT INTO events (uuid, type, created_by, created_at)`;
      sql`VALUES (${uuid}, ${eventType}, ${createdBy}, ${createdAt}) RETURNING id`;
    }),
  );
  if (eventResult.isError()) return eventResult;
  const eventsId = eventResult.value.id;

  const entitiesResult = await queryRun(
    database,
    context,
    buildPostgresSqlQuery(({ sql, addValue }) => {
      sql`INSERT INTO event_entity_versions (events_id, entity_versions_id, published_name) VALUES`;
      const eventsValue = addValue(eventsId);
      for (const { entityVersionsId, publishedName } of entityVersions) {
        sql`, (${eventsValue}, ${entityVersionsId}, ${publishedName ?? null})`;
      }
    }),
  );
  if (entitiesResult.isError()) return entitiesResult;

  return ok(undefined);
}

export async function createCreatePrincipalEvent(
  database: PostgresDatabaseAdapter,
  context: TransactionContext,
  subjectInternalId: number,
  principalInternalId: number,
  syncEvent: CreatePrincipalSyncEvent | null,
): PromiseResult<void, typeof ErrorType.Generic> {
  const result = await queryRun(
    database,
    context,
    buildPostgresSqlQuery(({ sql }) => {
      const uuid = syncEvent?.id ?? DEFAULT;
      const createdAt = syncEvent?.createdAt ?? DEFAULT;
      sql`INSERT INTO events (uuid, type, created_by, created_at, principals_id)`;
      sql`VALUES (${uuid}, ${EventType.createPrincipal}, ${subjectInternalId}, ${createdAt}, ${principalInternalId})`;
    }),
  );
  if (result.isError()) return result;
  return ok(undefined);
}

export async function createUpdateSchemaEvent(
  database: PostgresDatabaseAdapter,
  context: TransactionContext,
  session: Session,
  schemaVersionId: number,
  syncEvent: UpdateSchemaSyncEvent | null,
): PromiseResult<void, typeof ErrorType.Generic> {
  const createdBy = getSessionSubjectInternalId(session);
  const result = await queryRun(
    database,
    context,
    buildPostgresSqlQuery(({ sql }) => {
      const uuid = syncEvent?.id ?? DEFAULT;
      const createdAt = syncEvent?.createdAt ?? DEFAULT;
      sql`INSERT INTO events (uuid, type, created_by, created_at, schema_versions_id)`;
      sql`VALUES (${uuid}, ${EventType.updateSchema}, ${createdBy}, ${createdAt}, ${schemaVersionId})`;
    }),
  );
  if (result.isError()) return result;
  return ok(undefined);
}
