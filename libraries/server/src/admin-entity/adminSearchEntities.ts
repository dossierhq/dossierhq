import type {
  AdminEntity,
  AdminSchema,
  AdminSearchQuery,
  Connection,
  Edge,
  ErrorType,
  Paging,
  PromiseResult,
} from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type { AuthorizationAdapter, SessionContext } from '..';
import { authResolveAuthorizationKeys } from '../Auth';
import { decodeAdminEntity } from '../EntityCodec';
import { resolvePagingInfo, sharedSearchEntities } from '../shared-entity/sharedSearchEntities';

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

  const searchResult = await databaseAdapter.adminEntitySearchEntities(
    schema,
    context,
    query,
    pagingInfo,
    authKeysResult.value
  );
  if (searchResult.isError()) return searchResult;
  return await sharedSearchEntities(schema, pagingInfo, searchResult.value, decodeAdminEntity);
}
