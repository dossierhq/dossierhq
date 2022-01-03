import type {
  Connection,
  Edge,
  ErrorType,
  Paging,
  PromiseResult,
  PublishedEntity,
  PublishedQuery,
  PublishedSchema,
} from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type { AuthorizationAdapter, SessionContext } from '..';
import { authResolveAuthorizationKeys } from '../Auth';
import { decodePublishedEntity } from '../EntityCodec';
import { sharedSearchEntities } from '../shared-entity/sharedSearchEntities';

export async function publishedSearchEntities(
  schema: PublishedSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: PublishedQuery | undefined,
  paging: Paging | undefined
): PromiseResult<
  Connection<Edge<PublishedEntity, ErrorType>> | null,
  ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const authKeysResult = await authResolveAuthorizationKeys(
    authorizationAdapter,
    context,
    query?.authKeys
  );
  if (authKeysResult.isError()) {
    return authKeysResult;
  }

  const searchResult = await databaseAdapter.publishedEntitySearchEntities(
    schema,
    context,
    query,
    paging,
    authKeysResult.value
  );
  if (searchResult.isError()) {
    return searchResult;
  }

  return await sharedSearchEntities(schema, searchResult.value, decodePublishedEntity);
}
