import type {
  ErrorType,
  PromiseResult,
  PublishedQuery,
  PublishedSchema,
} from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type { AuthorizationAdapter, SessionContext } from '..';
import { authResolveAuthorizationKeys } from '../Auth';

export async function publishedGetTotalCount(
  schema: PublishedSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: PublishedQuery | undefined
): PromiseResult<number, ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic> {
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
