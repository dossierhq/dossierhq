import type { ErrorType, PromiseResult, AdminSchemaSpecification } from '@dossierhq/core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNone } from '../QueryFunctions.js';

export async function schemaUpdateSpecification(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  schemaSpec: AdminSchemaSpecification
): PromiseResult<void, typeof ErrorType.Generic> {
  return await queryNone(adapter, context, {
    text: 'INSERT INTO schema_versions (specification) VALUES ($1)',
    values: [schemaSpec],
  });
}
