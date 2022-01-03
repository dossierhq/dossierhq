import type { ErrorType, PromiseResult, AdminSchemaSpecification } from '@jonasb/datadata-core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import type { PostgresDatabaseAdapter } from '..';
import { queryNone } from '../QueryFunctions';

export async function schemaUpdateSpecification(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  schemaSpec: AdminSchemaSpecification
): PromiseResult<void, ErrorType.Generic> {
  return await queryNone(adapter, context, {
    text: 'INSERT INTO schema_versions (specification) VALUES ($1)',
    values: [schemaSpec],
  });
}
