import {
  ok,
  type ErrorType,
  type PromiseResult,
  type SchemaSpecificationWithMigrations,
} from '@dossierhq/core';
import type { TransactionContext } from '@dossierhq/database-adapter';
import type { SchemaVersionsTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNoneOrOne } from '../QueryFunctions.js';

export async function schemaGetSpecification(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
): PromiseResult<SchemaSpecificationWithMigrations | null, typeof ErrorType.Generic> {
  const result = await queryNoneOrOne<Pick<SchemaVersionsTable, 'version' | 'specification'>>(
    adapter,
    context,
    'SELECT version, specification FROM schema_versions ORDER BY version DESC LIMIT 1',
  );
  if (result.isError()) return result;

  if (result.value) {
    const { version, specification } = result.value;
    return ok({ ...specification, version });
  }
  return ok(null);
}
