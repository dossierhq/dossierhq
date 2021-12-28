import {
  ok,
  type AdminSchemaSpecification,
  type ErrorType,
  type PromiseResult,
} from '@jonasb/datadata-core';
import type { TransactionContext } from '@jonasb/datadata-server';
import type { SqliteDatabaseAdapter } from '..';
import type { SchemaVersionsTable } from '../DatabaseSchema';
import { queryNoneOrOne } from '../QueryFunctions';

export async function schemaGetSpecification(
  adapter: SqliteDatabaseAdapter,
  context: TransactionContext
): PromiseResult<AdminSchemaSpecification | null, ErrorType.Generic> {
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
    return ok(JSON.parse(specification));
  }
  return ok(null);
}
