import type {
  AdminSchemaWithMigrations,
  Connection,
  Edge,
  ErrorType,
  Paging,
  PromiseResult,
  PublishedEntitiesQuery,
  PublishedEntity,
  PublishedSchema,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import { authResolveAuthorizationKeys } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { decodePublishedEntity } from '../EntityCodec.js';
import { fetchAndDecodeConnection } from '../utils/fetchAndDecodeConnection.js';

export async function publishedSearchEntities(
  adminSchema: AdminSchemaWithMigrations,
  publishedSchema: PublishedSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: PublishedEntitiesQuery | undefined,
  paging: Paging | undefined,
): PromiseResult<
  Connection<Edge<PublishedEntity, ErrorType>> | null,
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
      databaseAdapter.publishedEntitySearchEntities(
        publishedSchema,
        context,
        query,
        pagingInfo,
        authKeysResult.value,
      ),
    (edge) => decodePublishedEntity(adminSchema, edge),
  );
}
