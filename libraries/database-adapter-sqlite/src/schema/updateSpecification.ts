import type { AdminSchemaSpecification, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type { TransactionContext } from '@jonasb/datadata-server';
import type { SqliteDatabaseAdapter } from '..';
import { queryNone } from '../QueryFunctions';

export async function schemaUpdateSpecification(
  adapter: SqliteDatabaseAdapter,
  context: TransactionContext,
  schemaSpec: AdminSchemaSpecification
): PromiseResult<void, ErrorType.Generic> {
  return await queryNone(adapter, context, {
    text: 'INSERT INTO schema_versions (specification) VALUES (?1)',
    values: [JSON.stringify(schemaSpec)],
  });
}
