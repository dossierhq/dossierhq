import {
  ok,
  type AdminEntitySharedQuery,
  type AdminSchema,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import { authResolveAuthorizationKeys } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';

export async function adminGetTotalCount(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: AdminEntitySharedQuery | undefined,
): PromiseResult<
  number,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  const authKeysResult = await authResolveAuthorizationKeys(
    authorizationAdapter,
    context,
    query?.authKeys,
  );
  if (authKeysResult.isError()) return authKeysResult;
  const authKeys = authKeysResult.value;

  if (authKeys.length === 0) {
    // User requested with authKeys, but they resolved to nothing, so we won't match any entity
    return ok(0);
  }

  return await databaseAdapter.adminEntitySearchTotalCount(schema, context, query, authKeys);
}
