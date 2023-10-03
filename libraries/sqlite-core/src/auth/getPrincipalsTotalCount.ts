import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import type { TransactionContext } from '@dossierhq/database-adapter';
import { queryOne, type Database } from '../QueryFunctions.js';

export async function authGetPrincipalsTotalCount(
  database: Database,
  context: TransactionContext,
): PromiseResult<number, typeof ErrorType.Generic> {
  const result = await queryOne<{ count: number }>(
    database,
    context,
    'SELECT COUNT(*) as count FROM principals',
  );
  if (result.isError()) return result;
  return ok(result.value.count);
}
