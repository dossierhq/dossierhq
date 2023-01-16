import type { AdminSchemaSpecification, ErrorType, PromiseResult } from '@dossierhq/core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import type { Database } from '../QueryFunctions.js';
import { queryRun } from '../QueryFunctions.js';

export async function schemaUpdateSpecification(
  database: Database,
  context: TransactionContext,
  schemaSpec: AdminSchemaSpecification
): PromiseResult<void, typeof ErrorType.Generic> {
  return await queryRun(database, context, {
    text: 'INSERT INTO schema_versions (specification) VALUES (?1)',
    values: [JSON.stringify(schemaSpec)],
  });
}
