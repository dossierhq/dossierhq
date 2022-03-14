import type {
  Connection,
  Edge,
  Paging,
  PromiseResult,
  PublishedEntity,
  PublishedSchema,
  PublishedSearchQuery,
} from '@jonasb/datadata-core';
import { ErrorType } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type { AuthorizationAdapter, SessionContext } from '..';
import { authResolveAuthorizationKeys } from '../Auth';
import { decodePublishedEntity } from '../EntityCodec';
import {
  resolvePagingInfo,
  sharedSearchEntities,
  sharedSearchEntities2,
} from '../shared-entity/sharedSearchEntities';

export async function publishedSearchEntities(
  schema: PublishedSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: PublishedSearchQuery | undefined,
  paging: Paging | undefined
): PromiseResult<
  Connection<Edge<PublishedEntity, ErrorType>> | null,
  ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const pagingResult = resolvePagingInfo(paging);
  if (pagingResult.isError()) return pagingResult;
  const pagingInfo = pagingResult.value;

  const authKeysResult = await authResolveAuthorizationKeys(
    authorizationAdapter,
    context,
    query?.authKeys
  );
  if (authKeysResult.isError()) return authKeysResult;

  const searchResult2 = await databaseAdapter.publishedEntitySearchEntities2(
    schema,
    context,
    query,
    pagingInfo,
    authKeysResult.value
  );
  if (searchResult2.isOk() || !searchResult2.isErrorType(ErrorType.Generic)) {
    if (searchResult2.isError()) return searchResult2;
    return await sharedSearchEntities2(
      schema,
      pagingInfo,
      searchResult2.value,
      decodePublishedEntity
    );
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
