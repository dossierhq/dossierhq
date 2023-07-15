import type {
  AdminEntity,
  AdminSchema,
  AdminSearchQuery,
  Connection,
  Edge,
  ErrorType,
  Paging,
  PromiseResult,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import { authResolveAuthorizationKeys } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { decodeAdminEntity } from '../EntityCodec.js';
import {
  getOppositeDirectionPaging,
  resolvePagingInfo,
  sharedSearchEntities,
} from '../shared-entity/sharedSearchEntities.js';

export async function adminSearchEntities(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: AdminSearchQuery | undefined,
  paging: Paging | undefined,
): PromiseResult<
  Connection<Edge<AdminEntity, ErrorType>> | null,
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

  const searchResult = await databaseAdapter.adminEntitySearchEntities(
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
    const oppositeResult = await databaseAdapter.adminEntitySearchEntities(
      schema,
      context,
      query,
      oppositePagingInfo,
      authKeysResult.value,
    );
    if (oppositeResult.isError()) return oppositeResult;
    hasMoreOppositeDirection = oppositeResult.value.hasMore;
  }

  return sharedSearchEntities(
    schema,
    pagingInfo,
    searchResult.value,
    hasMoreOppositeDirection,
    decodeAdminEntity,
  );
}
