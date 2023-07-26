import {
  ok,
  type AdminSchemaSpecificationWithMigrations,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import type { TransactionContext } from '@dossierhq/database-adapter';
import { queryRun, type Database } from '../QueryFunctions.js';

export async function schemaUpdateSpecification(
  database: Database,
  context: TransactionContext,
  schemaSpec: AdminSchemaSpecificationWithMigrations,
): PromiseResult<void, typeof ErrorType.Conflict | typeof ErrorType.Generic> {
  const { version, ...schemaSpecWithoutVersion } = schemaSpec;
  const result = await queryRun(database, context, {
    text: 'INSERT INTO schema_versions (version, specification, updated_at) VALUES (?1, ?2, ?3)',
    values: [version, JSON.stringify(schemaSpecWithoutVersion), new Date().toISOString()],
  });
  return result.isOk() ? ok(undefined) : result;
}
