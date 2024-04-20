import {
  ok,
  type AdminEntityQuery,
  type Schema,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import type {
  DatabaseAdminEntitySearchPayload,
  DatabasePagingInfo,
  ResolvedAuthKey,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryMany } from '../QueryFunctions.js';
import type { SearchAdminEntitiesItem } from '../search/QueryGenerator.js';
import { searchAdminEntitiesQuery } from '../search/QueryGenerator.js';
import { resolveAdminEntityInfo, resolveEntityFields } from '../utils/CodecUtils.js';
import { resolveConnectionPagingAndOrdering } from '../utils/ConnectionUtils.js';

export async function adminEntitySearchEntities(
  databaseAdapter: PostgresDatabaseAdapter,
  schema: Schema,
  context: TransactionContext,
  query: AdminEntityQuery | undefined,
  paging: DatabasePagingInfo,
  resolvedAuthKeys: ResolvedAuthKey[],
): PromiseResult<
  DatabaseAdminEntitySearchPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const sqlQueryResult = searchAdminEntitiesQuery(
    databaseAdapter,
    schema,
    query,
    paging,
    resolvedAuthKeys,
  );
  if (sqlQueryResult.isError()) return sqlQueryResult;
  const { cursorExtractor, sqlQuery } = sqlQueryResult.value;

  const connectionResult = await queryMany<SearchAdminEntitiesItem>(
    databaseAdapter,
    context,
    sqlQuery,
  );
  if (connectionResult.isError()) return connectionResult;

  const { hasMore, edges } = resolveConnectionPagingAndOrdering(paging, connectionResult.value);

  return ok({
    hasMore,
    edges: edges.map((edge) => ({
      ...resolveAdminEntityInfo(edge),
      ...resolveEntityFields(edge),
      id: edge.uuid,
      cursor: cursorExtractor(edge),
    })),
  });
}
