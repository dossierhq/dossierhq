import {
  ok,
  type AdminSchemaSpecification,
  type ErrorType,
  type PromiseResult,
} from '@jonasb/datadata-core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import type { SchemaVersionsTable } from '../DatabaseSchema';
import type { Database } from '../QueryFunctions';
import { queryNoneOrOne } from '../QueryFunctions';

export async function schemaGetSpecification(
  database: Database,
  context: TransactionContext
): PromiseResult<AdminSchemaSpecification | null, ErrorType.Generic> {
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
