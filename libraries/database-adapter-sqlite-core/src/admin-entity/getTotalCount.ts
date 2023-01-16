import type { AdminQuery, AdminSchema, ErrorType, PromiseResult } from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type { ResolvedAuthKey, TransactionContext } from '@jonasb/datadata-database-adapter';
import type { Database } from '../QueryFunctions.js';
import { queryOne } from '../QueryFunctions.js';
import { totalAdminEntitiesQuery } from '../search/QueryGenerator.js';

export async function adminEntitySearchTotalCount(
  database: Database,
  schema: AdminSchema,
  context: TransactionContext,
  query: AdminQuery | undefined,
  resolvedAuthKeys: ResolvedAuthKey[]
): PromiseResult<number, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const sqlQuery = totalAdminEntitiesQuery(schema, resolvedAuthKeys, query);
  if (sqlQuery.isError()) {
    return sqlQuery;
  }

  const result = await queryOne<{ count: number }>(database, context, sqlQuery.value);
  if (result.isError()) {
    return result;
  }
  return ok(result.value.count);
}
