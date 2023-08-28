import type {
  AdminEntitiesQuery,
  AdminEntity,
  AdminSchemaWithMigrations,
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
import { fetchAndDecodeConnection } from '../utils/fetchAndDecodeConnection.js';

export async function adminSearchEntities(
  schema: AdminSchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: AdminEntitiesQuery | undefined,
  paging: Paging | undefined,
): PromiseResult<
  Connection<Edge<AdminEntity, ErrorType>> | null,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  const authKeysResult = await authResolveAuthorizationKeys(
    authorizationAdapter,
    context,
    query?.authKeys,
  );
  if (authKeysResult.isError()) return authKeysResult;

  return fetchAndDecodeConnection(
    paging,
    (pagingInfo) =>
      databaseAdapter.adminEntitySearchEntities(
        schema,
        context,
        query,
        pagingInfo,
        authKeysResult.value,
      ),
    (edge) => decodeAdminEntity(schema, edge),
  );
}
