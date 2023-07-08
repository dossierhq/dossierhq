import {
  ok,
  type AdminSchemaSpecification,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import type { TransactionContext } from '@dossierhq/database-adapter';
import type { Database } from '../QueryFunctions.js';
import { queryRun } from '../QueryFunctions.js';

export async function schemaUpdateSpecification(
  database: Database,
  context: TransactionContext,
  schemaSpec: AdminSchemaSpecification,
): PromiseResult<void, typeof ErrorType.Generic> {
  const result = await queryRun(database, context, {
    text: 'INSERT INTO schema_versions (specification) VALUES (?1)',
    values: [JSON.stringify(schemaSpec)],
  });
  return result.isOk() ? ok(undefined) : result;
}
