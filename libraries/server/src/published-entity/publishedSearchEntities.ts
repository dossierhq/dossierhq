import type {
  Connection,
  Edge,
  ErrorType,
  Paging,
  PromiseResult,
  PublishedEntity,
  PublishedSchema,
  PublishedSearchQuery,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import { authResolveAuthorizationKeys } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { decodePublishedEntity } from '../EntityCodec.js';
import {
  getOppositeDirectionPaging,
  resolvePagingInfo,
  sharedSearchEntities,
} from '../shared-entity/sharedSearchEntities.js';

export async function publishedSearchEntities(
  schema: PublishedSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: PublishedSearchQuery | undefined,
  paging: Paging | undefined,
): PromiseResult<
  Connection<Edge<PublishedEntity, ErrorType>> | null,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  const pagingResult = resolvePagingInfo(paging);
  if (pagingResult.isError()) return pagingResult;
  const pagingInfo = pagingResult.value;

  const authKeysResult = await authResolveAuthorizationKeys(
    authorizationAdapter,
    context,
    query?.authKeys,
  );
  if (authKeysResult.isError()) return authKeysResult;

  const searchResult = await databaseAdapter.publishedEntitySearchEntities(
    schema,
    context,
    query,
    pagingInfo,
    authKeysResult.value,
  );
  if (searchResult.isError()) return searchResult;

  let hasMoreOppositeDirection = false;
  const oppositePagingInfo = getOppositeDirectionPaging(pagingInfo, searchResult.value);
  if (oppositePagingInfo) {
    const oppositeResult = await databaseAdapter.publishedEntitySearchEntities(
      schema,
      context,
      query,
      oppositePagingInfo,
      authKeysResult.value,
    );
    if (oppositeResult.isError()) return oppositeResult;
    hasMoreOppositeDirection = oppositeResult.value.hasMore;
  }

  return await sharedSearchEntities(
    schema,
    pagingInfo,
    searchResult.value,
    hasMoreOppositeDirection,
    decodePublishedEntity,
  );
}
