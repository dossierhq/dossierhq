import {
  ok,
  type ErrorType,
  type PromiseResult,
  type SchemaSpecificationWithMigrations,
  type UpdateSchemaSyncEvent,
} from '@dossierhq/core';
import {
  buildSqliteSqlQuery,
  type Session,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { SchemaVersionsTable } from '../DatabaseSchema.js';
import { queryOne, type Database } from '../QueryFunctions.js';
import { getTransactionTimestamp } from '../SqliteTransaction.js';
import { createUpdateSchemaEvent } from '../utils/EventUtils.js';

export async function schemaUpdateSpecification(
  database: Database,
  context: TransactionContext,
  session: Session,
  schemaSpec: SchemaSpecificationWithMigrations,
  syncEvent: UpdateSchemaSyncEvent | null,
): PromiseResult<void, typeof ErrorType.Conflict | typeof ErrorType.Generic> {
  const { version, ...schemaSpecWithoutVersion } = schemaSpec;

  const now = (
    syncEvent ? syncEvent.createdAt : getTransactionTimestamp(context.transaction)
  ).toISOString();

  const createVersionResult = await queryOne<Pick<SchemaVersionsTable, 'id'>>(
    database,
    context,
    buildSqliteSqlQuery(({ sql }) => {
      sql`INSERT INTO schema_versions (version, specification, updated_at)`;
      sql`VALUES (${version}, ${JSON.stringify(schemaSpecWithoutVersion)}, ${now}) RETURNING id`;
    }),
  );
  if (createVersionResult.isError()) return createVersionResult;
  const { id: schemaVersionId } = createVersionResult.value;

  const createEventResult = await createUpdateSchemaEvent(
    database,
    context,
    session,
    schemaVersionId,
    syncEvent,
  );
  if (createEventResult.isError()) return createEventResult;

  return ok(undefined);
}
