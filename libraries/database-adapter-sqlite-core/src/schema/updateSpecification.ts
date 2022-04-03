import type { AdminSchemaSpecification, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import type { Database } from '../QueryFunctions';
import { queryNone } from '../QueryFunctions';

export async function schemaUpdateSpecification(
  database: Database,
  context: TransactionContext,
  schemaSpec: AdminSchemaSpecification
): PromiseResult<void, ErrorType.Generic> {
  return await queryNone(database, context, {
    text: 'INSERT INTO schema_versions (specification) VALUES (?1)',
    values: [JSON.stringify(schemaSpec)],
  });
}
