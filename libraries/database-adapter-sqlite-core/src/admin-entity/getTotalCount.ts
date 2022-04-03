import type { AdminQuery, AdminSchema, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { ResolvedAuthKey, TransactionContext } from '@jonasb/datadata-database-adapter';
import type { Database } from '../QueryFunctions';
import { queryOne } from '../QueryFunctions';
import { totalAdminEntitiesQuery } from '../search/QueryGenerator';

export async function adminEntitySearchTotalCount(
  database: Database,
  schema: AdminSchema,
  context: TransactionContext,
  query: AdminQuery | undefined,
  resolvedAuthKeys: ResolvedAuthKey[]
): PromiseResult<number, ErrorType.BadRequest | ErrorType.Generic> {
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
