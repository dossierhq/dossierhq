import {
  ok,
  type ErrorType,
  type PromiseResult,
  type PublishedEntityQuery,
  type PublishedSchema,
} from '@dossierhq/core';
import type {
  DatabasePagingInfo,
  DatabasePublishedEntitySearchPayload,
  ResolvedAuthKey,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { queryMany, type Database } from '../QueryFunctions.js';
import {
  searchPublishedEntitiesQuery,
  type SearchPublishedEntitiesItem,
} from '../search/QueryGenerator.js';
import { assertIsDefined } from '../utils/AssertUtils.js';
import { resolveEntityFields, resolvePublishedEntityInfo } from '../utils/CodecUtils.js';
import { resolveConnectionPagingAndOrdering } from '../utils/ConnectionUtils.js';

export async function publishedEntitySearchEntities(
  database: Database,
  schema: PublishedSchema,
  context: TransactionContext,
  query: PublishedEntityQuery | undefined,
  paging: DatabasePagingInfo,
  resolvedAuthKeys: ResolvedAuthKey[],
): PromiseResult<
  DatabasePublishedEntitySearchPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const sqlQueryResult = searchPublishedEntitiesQuery(
    database,
    schema,
    query,
    paging,
    resolvedAuthKeys,
  );
  if (sqlQueryResult.isError()) return sqlQueryResult;
  const { cursorExtractor, sqlQuery } = sqlQueryResult.value;

  const connectionResult = await queryMany<SearchPublishedEntitiesItem>(
    database,
    context,
    sqlQuery,
  );
  if (connectionResult.isError()) return connectionResult;

  const { hasMore, edges } = resolveConnectionPagingAndOrdering(paging, connectionResult.value);

  return ok({
    hasMore,
    edges: edges.map((edge) => {
      assertIsDefined(edge.uuid);
      return {
        ...resolvePublishedEntityInfo(edge),
        ...resolveEntityFields(edge),
        id: edge.uuid,
        cursor: cursorExtractor(edge),
      };
    }),
  });
}
