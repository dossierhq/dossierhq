import type { ErrorType, PromiseResult, PublishedQuery, PublishedSchema } from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type {
  DatabasePublishedEntityPayload,
  ResolvedAuthKey,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { Database } from '../QueryFunctions.js';
import { queryMany } from '../QueryFunctions.js';
import type { SearchPublishedEntitiesItem } from '../search/QueryGenerator.js';
import { samplePublishedEntitiesQuery } from '../search/QueryGenerator.js';

export async function publishedEntitySampleEntities(
  database: Database,
  schema: PublishedSchema,
  context: TransactionContext,
  query: PublishedQuery | undefined,
  offset: number,
  limit: number,
  resolvedAuthKeys: ResolvedAuthKey[]
): PromiseResult<
  DatabasePublishedEntityPayload[],
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const sqlQueryResult = samplePublishedEntitiesQuery(
    schema,
    query,
    offset,
    limit,
    resolvedAuthKeys
  );
  if (sqlQueryResult.isError()) return sqlQueryResult;

  const searchResult = await queryMany<SearchPublishedEntitiesItem>(
    database,
    context,
    sqlQueryResult.value
  );
  if (searchResult.isError()) return searchResult;

  const entitiesValues = searchResult.value;

  return ok(
    entitiesValues.map((it) => ({
      id: it.uuid,
      type: it.type,
      name: it.name,
      createdAt: new Date(it.created_at),
      authKey: it.auth_key,
      fieldValues: JSON.parse(it.fields),
    }))
  );
}