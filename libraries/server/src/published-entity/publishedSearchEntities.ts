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
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '..';
import { authResolveAuthorizationKeys } from '../Auth';
import { queryMany } from '../Database';
import { decodePublishedEntity } from '../EntityCodec';
import { sharedSearchEntities } from '../EntitySearcher';
import type { SearchPublishedEntitiesItem } from '../QueryGenerator';
import { searchPublishedEntitiesQuery } from '../QueryGenerator';

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

  const sqlQueryResult = searchPublishedEntitiesQuery(schema, query, paging, authKeysResult.value);
  if (sqlQueryResult.isError()) {
    return sqlQueryResult;
  }

  const entitiesValues = await queryMany<SearchPublishedEntitiesItem>(
    databaseAdapter,
    context,
    sqlQueryResult.value
  );

  return await sharedSearchEntities<PublishedSchema, PublishedEntity, SearchPublishedEntitiesItem>(
    schema,
    sqlQueryResult.value,
    entitiesValues,
    decodePublishedEntity
  );
}
