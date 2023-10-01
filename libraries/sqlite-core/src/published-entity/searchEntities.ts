import type {
  ErrorType,
  PromiseResult,
  PublishedEntityQuery,
  PublishedSchema,
} from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type {
  DatabasePagingInfo,
  DatabasePublishedEntitySearchPayload,
  ResolvedAuthKey,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { Database } from '../QueryFunctions.js';
import { queryMany } from '../QueryFunctions.js';
import type { SearchPublishedEntitiesItem } from '../search/QueryGenerator.js';
import { searchPublishedEntitiesQuery } from '../search/QueryGenerator.js';
import { resolveEntityFields, resolvePublishedEntityInfo } from '../utils/CodecUtils.js';
import { convertConnectionPayload } from '../utils/ConnectionUtils.js';

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

  const searchResult = await queryMany<SearchPublishedEntitiesItem>(database, context, sqlQuery);
  if (searchResult.isError()) return searchResult;
  const rows = searchResult.value;

  return ok(
    convertConnectionPayload(database, paging, rows, (_database, row) => ({
      ...resolvePublishedEntityInfo(row),
      ...resolveEntityFields(row),
      id: row.uuid,
      cursor: cursorExtractor(row),
    })),
  );
}
