import {
  ok,
  type EntityQuery,
  type ErrorType,
  type PromiseResult,
  type Schema,
} from '@dossierhq/core';
import type {
  DatabaseAdminEntitySearchPayload,
  DatabasePagingInfo,
  ResolvedAuthKey,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { queryMany, type Database } from '../QueryFunctions.js';
import {
  searchAdminEntitiesQuery,
  type SearchAdminEntitiesItem,
} from '../search/QueryGenerator.js';
import { assertIsDefined } from '../utils/AssertUtils.js';
import { resolveAdminEntityInfo, resolveEntityFields } from '../utils/CodecUtils.js';
import { resolveConnectionPagingAndOrdering } from '../utils/ConnectionUtils.js';

export async function adminEntitySearchEntities(
  database: Database,
  schema: Schema,
  context: TransactionContext,
  query: EntityQuery | undefined,
  paging: DatabasePagingInfo,
  resolvedAuthKeys: ResolvedAuthKey[],
): PromiseResult<
  DatabaseAdminEntitySearchPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const sqlQueryResult = searchAdminEntitiesQuery(
    database,
    schema,
    query,
    paging,
    resolvedAuthKeys,
  );
  if (sqlQueryResult.isError()) return sqlQueryResult;
  const { cursorExtractor, sqlQuery } = sqlQueryResult.value;

  const connectionResult = await queryMany<SearchAdminEntitiesItem>(database, context, sqlQuery);
  if (connectionResult.isError()) return connectionResult;

  const { hasMore, edges } = resolveConnectionPagingAndOrdering(paging, connectionResult.value);

  return ok({
    hasMore,
    edges: edges.map((edge) => {
      assertIsDefined(edge.uuid);
      return {
        ...resolveAdminEntityInfo(edge),
        ...resolveEntityFields(edge),
        id: edge.uuid,
        cursor: cursorExtractor(edge),
      };
    }),
  });
}
