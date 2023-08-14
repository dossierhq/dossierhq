import {
  ok,
  EventType,
  type AdminSchemaSpecificationWithMigrations,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import {
  buildSqliteSqlQuery,
  type Session,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { SchemaVersionsTable } from '../DatabaseSchema.js';
import { queryOne, queryRun, type Database } from '../QueryFunctions.js';
import { getSessionSubjectInternalId } from '../utils/SessionUtils.js';

export async function schemaUpdateSpecification(
  database: Database,
  context: TransactionContext,
  session: Session,
  schemaSpec: AdminSchemaSpecificationWithMigrations,
): PromiseResult<void, typeof ErrorType.Conflict | typeof ErrorType.Generic> {
  const { version, ...schemaSpecWithoutVersion } = schemaSpec;

  const now = new Date().toISOString();

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

  const createEventResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(({ sql }) => {
      sql`INSERT INTO events (type, created_by, created_at, schema_versions_id)`;
      sql`VALUES (${EventType.updateSchema}, ${getSessionSubjectInternalId(
        session,
      )}, ${now}, ${schemaVersionId})`;
    }),
  );
  if (createEventResult.isError()) return createEventResult;

  return ok(undefined);
}
