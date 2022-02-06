import type {
  ErrorType,
  PromiseResult,
  PublishedQuery,
  PublishedSchema,
} from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type {
  DatabasePublishedEntityPayload,
  ResolvedAuthKey,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { Temporal } from '@js-temporal/polyfill';
import type { SqliteDatabaseAdapter } from '..';
import { queryMany } from '../QueryFunctions';
import type { SearchPublishedEntitiesItem } from '../search/QueryGenerator';
import { samplePublishedEntitiesQuery } from '../search/QueryGenerator';

export async function publishedEntitySampleEntities(
  databaseAdapter: SqliteDatabaseAdapter,
  schema: PublishedSchema,
  context: TransactionContext,
  query: PublishedQuery | undefined,
  offset: number,
  limit: number,
  resolvedAuthKeys: ResolvedAuthKey[]
): PromiseResult<DatabasePublishedEntityPayload[], ErrorType.BadRequest | ErrorType.Generic> {
  const sqlQueryResult = samplePublishedEntitiesQuery(
    schema,
    query,
    offset,
    limit,
    resolvedAuthKeys
  );
  if (sqlQueryResult.isError()) return sqlQueryResult;

  const searchResult = await queryMany<SearchPublishedEntitiesItem>(
    databaseAdapter,
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
      createdAt: Temporal.Instant.from(it.created_at),
      authKey: it.auth_key,
      fieldValues: JSON.parse(it.fields),
    }))
  );
}
