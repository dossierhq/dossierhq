import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import type { TransactionContext } from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryOne } from '../QueryFunctions.js';

export async function authGetPrincipalsTotalCount(
  database: PostgresDatabaseAdapter,
  context: TransactionContext,
): PromiseResult<number, typeof ErrorType.Generic> {
  const result = await queryOne<{ count: number }>(
    database,
    context,
    'SELECT COUNT(*)::integer as count FROM principals',
  );
  if (result.isError()) return result;
  return ok(result.value.count);
}
