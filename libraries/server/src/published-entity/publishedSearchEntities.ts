import {
  ok,
  type Connection,
  type Edge,
  type ErrorType,
  type Paging,
  type PromiseResult,
  type PublishedEntity,
  type PublishedEntityQuery,
  type PublishedSchema,
  type SchemaWithMigrations,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import { authResolveAuthorizationKeys } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { decodePublishedEntity } from '../EntityCodec.js';
import { fetchAndDecodeConnection } from '../utils/fetchAndDecodeConnection.js';

export async function publishedSearchEntities(
  schema: SchemaWithMigrations,
  publishedSchema: PublishedSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: PublishedEntityQuery | undefined,
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
  const authKeys = authKeysResult.value;

  if (authKeys.length === 0) {
    // User requested with authKeys, but they resolved to nothing, so we won't match any entity
    return ok(null);
  }

  return fetchAndDecodeConnection(
    paging,
    (pagingInfo) =>
      databaseAdapter.publishedEntitySearchEntities(
        publishedSchema,
        context,
        query,
        pagingInfo,
        authKeys,
      ),
    (edge) => decodePublishedEntity(schema, edge),
  );
}
