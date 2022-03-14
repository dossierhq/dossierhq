import type {
  AdminEntity,
  AdminSchema,
  AdminSearchQuery,
  Connection,
  Edge,
  Paging,
  PromiseResult,
} from '@jonasb/datadata-core';
import { ErrorType } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type { AuthorizationAdapter, SessionContext } from '..';
import { authResolveAuthorizationKeys } from '../Auth';
import { decodeAdminEntity } from '../EntityCodec';
import {
  resolvePagingInfo,
  sharedSearchEntities,
  sharedSearchEntities2,
} from '../shared-entity/sharedSearchEntities';

export async function adminSearchEntities(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: AdminSearchQuery | undefined,
  paging: Paging | undefined
): PromiseResult<
  Connection<Edge<AdminEntity, ErrorType>> | null,
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

  const searchResult2 = await databaseAdapter.adminEntitySearchEntities2(
    schema,
    context,
    query,
    pagingInfo,
    authKeysResult.value
  );
  if (searchResult2.isOk() || !searchResult2.isErrorType(ErrorType.Generic)) {
    if (searchResult2.isError()) return searchResult2;
    return await sharedSearchEntities2(schema, pagingInfo, searchResult2.value, decodeAdminEntity);
  }

  //TODO remove when no longer used
  const searchResult = await databaseAdapter.adminEntitySearchEntities(
    schema,
    context,
    query,
    paging,
    authKeysResult.value
  );
  if (searchResult.isError()) {
    return searchResult;
  }

  return await sharedSearchEntities(schema, searchResult.value, decodeAdminEntity);
}
