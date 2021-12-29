import type {
  AdminEntity,
  AdminQuery,
  AdminSchema,
  Connection,
  Edge,
  ErrorType,
  Paging,
  PromiseResult,
} from '@jonasb/datadata-core';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '..';
import { authResolveAuthorizationKeys } from '../Auth';
import { decodeAdminEntity } from '../EntityCodec';
import { sharedSearchEntities } from '../EntitySearcher';
import type { SearchAdminEntitiesItem } from '../QueryGenerator';
import { searchAdminEntitiesQuery } from '../QueryGenerator';

export async function adminSearchEntities(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: AdminQuery | undefined,
  paging: Paging | undefined
): PromiseResult<
  Connection<Edge<AdminEntity, ErrorType>> | null,
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

  const sqlQueryResult = searchAdminEntitiesQuery(schema, query, paging, authKeysResult.value);
  if (sqlQueryResult.isError()) {
    return sqlQueryResult;
  }

  return await sharedSearchEntities<AdminSchema, AdminEntity, SearchAdminEntitiesItem>(
    schema,
    databaseAdapter,
    context,
    sqlQueryResult.value,
    decodeAdminEntity
  );
}
