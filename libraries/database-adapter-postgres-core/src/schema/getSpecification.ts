import type { ErrorType, PromiseResult, AdminSchemaSpecification } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import type { SchemaVersionsTable } from '../DatabaseSchema.js';
import { queryNoneOrOne } from '../QueryFunctions.js';

export async function schemaGetSpecification(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext
): PromiseResult<AdminSchemaSpecification | null, typeof ErrorType.Generic> {
  const result = await queryNoneOrOne<Pick<SchemaVersionsTable, 'specification'>>(
    adapter,
    context,
    'SELECT specification FROM schema_versions ORDER BY id DESC LIMIT 1'
  );
  if (result.isError()) {
    return result;
  }

  if (result.value) {
    const { specification } = result.value;
    return ok(specification);
  }
  return ok(null);
}
