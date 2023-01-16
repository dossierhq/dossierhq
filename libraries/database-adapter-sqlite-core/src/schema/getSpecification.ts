import {
  ok,
  type AdminSchemaSpecification,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import type { SchemaVersionsTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryNoneOrOne } from '../QueryFunctions.js';

export async function schemaGetSpecification(
  database: Database,
  context: TransactionContext
): PromiseResult<AdminSchemaSpecification | null, typeof ErrorType.Generic> {
  const result = await queryNoneOrOne<Pick<SchemaVersionsTable, 'specification'>>(
    database,
    context,
    'SELECT specification FROM schema_versions ORDER BY id DESC LIMIT 1'
  );
  if (result.isError()) {
    return result;
  }

  if (result.value) {
    const { specification } = result.value;
    return ok(JSON.parse(specification));
  }
  return ok(null);
}
