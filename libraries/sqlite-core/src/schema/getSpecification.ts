import {
  ok,
  type AdminSchemaSpecificationWithMigrations,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import type { TransactionContext } from '@dossierhq/database-adapter';
import type { SchemaVersionsTable } from '../DatabaseSchema.js';
import { queryNoneOrOne, type Database } from '../QueryFunctions.js';

export async function schemaGetSpecification(
  database: Database,
  context: TransactionContext,
): PromiseResult<AdminSchemaSpecificationWithMigrations | null, typeof ErrorType.Generic> {
  const result = await queryNoneOrOne<Pick<SchemaVersionsTable, 'version' | 'specification'>>(
    database,
    context,
    'SELECT version, specification FROM schema_versions ORDER BY version DESC LIMIT 1',
  );
  if (result.isError()) return result;

  if (result.value) {
    const { version, specification } = result.value;
    return ok({ ...JSON.parse(specification), version });
  }
  return ok(null);
}
