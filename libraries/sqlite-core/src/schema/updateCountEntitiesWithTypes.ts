import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import { createSqliteSqlQuery, type TransactionContext } from '@dossierhq/database-adapter';
import { queryOne, type Database } from '../QueryFunctions.js';

export async function schemaUpdateCountEntitiesWithTypes(
  database: Database,
  context: TransactionContext,
  entityTypes: string[],
): PromiseResult<number, typeof ErrorType.Generic> {
  const { sql, query, addValueList } = createSqliteSqlQuery();
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  sql`SELECT COUNT(*) AS count FROM entities WHERE uuid IS NOT NULL AND type IN ${addValueList(entityTypes)}`;
  const result = await queryOne<{ count: number }>(database, context, query);
  if (result.isError()) return result;
  return ok(result.value.count);
}
