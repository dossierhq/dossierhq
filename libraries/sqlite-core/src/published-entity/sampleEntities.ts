import {
  ok,
  type ErrorType,
  type PromiseResult,
  type PublishedEntitySharedQuery,
  type PublishedSchema,
} from '@dossierhq/core';
import type {
  DatabasePublishedEntityPayload,
  ResolvedAuthKey,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { queryMany, type Database } from '../QueryFunctions.js';
import {
  samplePublishedEntitiesQuery,
  type SearchPublishedEntitiesItem,
} from '../search/QueryGenerator.js';
import { resolveEntityFields, resolvePublishedEntityInfo } from '../utils/CodecUtils.js';

export async function publishedEntitySampleEntities(
  database: Database,
  schema: PublishedSchema,
  context: TransactionContext,
  query: PublishedEntitySharedQuery | undefined,
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
    database,
    context,
    sqlQueryResult.value,
  );
  if (searchResult.isError()) return searchResult;

  const entitiesValues = searchResult.value;

  return ok(
    entitiesValues.map((it) => ({
      ...resolvePublishedEntityInfo(it),
      ...resolveEntityFields(it),
      id: it.uuid,
    })),
  );
}
