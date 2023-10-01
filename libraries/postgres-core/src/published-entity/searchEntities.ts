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
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryMany } from '../QueryFunctions.js';
import type { SearchPublishedEntitiesItem } from '../search/QueryGenerator.js';
import { searchPublishedEntitiesQuery } from '../search/QueryGenerator.js';
import { resolveEntityFields, resolvePublishedEntityInfo } from '../utils/CodecUtils.js';
import { convertConnectionPayload } from '../utils/ConnectionUtils.js';

export async function publishedEntitySearchEntities(
  databaseAdapter: PostgresDatabaseAdapter,
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
    databaseAdapter,
    schema,
    query,
    paging,
    resolvedAuthKeys,
  );
  if (sqlQueryResult.isError()) return sqlQueryResult;
  const { cursorExtractor, sqlQuery } = sqlQueryResult.value;

  const connectionResult = await queryMany<SearchPublishedEntitiesItem>(
    databaseAdapter,
    context,
    sqlQuery,
  );
  if (connectionResult.isError()) return connectionResult;

  const rows = connectionResult.value;

  return ok(
    convertConnectionPayload(databaseAdapter, paging, rows, (_database, row) => ({
      ...resolvePublishedEntityInfo(row),
      ...resolveEntityFields(row),
      id: row.uuid,
      cursor: cursorExtractor(row),
    })),
  );
}
