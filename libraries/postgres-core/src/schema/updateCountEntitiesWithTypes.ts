import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import { createPostgresSqlQuery, type TransactionContext } from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryOne } from '../QueryFunctions.js';

export async function schemaUpdateCountEntitiesWithTypes(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  entityTypes: string[],
): PromiseResult<number, typeof ErrorType.Generic> {
  const { sql, query } = createPostgresSqlQuery();
  sql`SELECT COUNT(*) AS count FROM entities WHERE type = ANY(${entityTypes})`;
  const result = await queryOne<{ count: number }>(adapter, context, query);
  if (result.isError()) return result;
  return ok(result.value.count);
}
