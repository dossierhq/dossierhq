import type { AdminQuery, AdminSchema, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '..';
import { authResolveAuthorizationKeys } from '../Auth';
import * as Db from '../Database';
import { totalAdminEntitiesQuery } from '../QueryGenerator';

export async function adminGetTotalCount(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: AdminQuery | undefined
): PromiseResult<number, ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic> {
  const authKeysResult = await authResolveAuthorizationKeys(
    authorizationAdapter,
    context,
    query?.authKeys
  );
  if (authKeysResult.isError()) {
    return authKeysResult;
  }

  const sqlQuery = totalAdminEntitiesQuery(schema, authKeysResult.value, query);
  if (sqlQuery.isError()) {
    return sqlQuery;
  }
  const { count } = await Db.queryOne<{ count: number }>(databaseAdapter, context, sqlQuery.value);
  return ok(count);
}
