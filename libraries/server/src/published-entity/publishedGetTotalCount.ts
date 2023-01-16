import type { ErrorType, PromiseResult, PublishedQuery, PublishedSchema } from '@dossierhq/core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import { authResolveAuthorizationKeys } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';

export async function publishedGetTotalCount(
  schema: PublishedSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: PublishedQuery | undefined
): PromiseResult<
  number,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  const authKeysResult = await authResolveAuthorizationKeys(
    authorizationAdapter,
    context,
    query?.authKeys
  );
  if (authKeysResult.isError()) {
    return authKeysResult;
  }

  return await databaseAdapter.publishedEntitySearchTotalCount(
    schema,
    context,
    query,
    authKeysResult.value
  );
}
