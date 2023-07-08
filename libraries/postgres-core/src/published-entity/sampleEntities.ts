import type { ErrorType, PromiseResult, PublishedQuery, PublishedSchema } from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type {
  DatabasePublishedEntityPayload,
  ResolvedAuthKey,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryMany } from '../QueryFunctions.js';
import type { SearchPublishedEntitiesItem } from '../search/QueryGenerator.js';
import { samplePublishedEntitiesQuery } from '../search/QueryGenerator.js';
import { resolvePublishedEntityInfo } from '../utils/CodecUtils.js';

export async function publishedEntitySampleEntities(
  databaseAdapter: PostgresDatabaseAdapter,
  schema: PublishedSchema,
  context: TransactionContext,
  query: PublishedQuery | undefined,
  offset: number,
  limit: number,
  resolvedAuthKeys: ResolvedAuthKey[],
): PromiseResult<
  DatabasePublishedEntityPayload[],
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const sqlQueryResult = samplePublishedEntitiesQuery(
    schema,
    query,
    offset,
    limit,
    resolvedAuthKeys,
  );
  if (sqlQueryResult.isError()) return sqlQueryResult;

  const searchResult = await queryMany<SearchPublishedEntitiesItem>(
    databaseAdapter,
    context,
    sqlQueryResult.value,
  );
  if (searchResult.isError()) return searchResult;

  const entitiesValues = searchResult.value;

  return ok(
    entitiesValues.map((it) => ({
      ...resolvePublishedEntityInfo(it),
      id: it.uuid,
      fieldValues: it.data,
    })),
  );
}
