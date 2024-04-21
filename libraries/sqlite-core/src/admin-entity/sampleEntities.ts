import type { EntitySharedQuery, Schema, ErrorType, PromiseResult } from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type {
  DatabaseAdminEntityPayload,
  ResolvedAuthKey,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { Database } from '../QueryFunctions.js';
import { queryMany } from '../QueryFunctions.js';
import type { SearchAdminEntitiesItem } from '../search/QueryGenerator.js';
import { sampleAdminEntitiesQuery } from '../search/QueryGenerator.js';
import { resolveAdminEntityInfo, resolveEntityFields } from '../utils/CodecUtils.js';

export async function adminEntitySampleEntities(
  database: Database,
  schema: Schema,
  context: TransactionContext,
  query: EntitySharedQuery | undefined,
  offset: number,
  limit: number,
  resolvedAuthKeys: ResolvedAuthKey[],
): PromiseResult<
  DatabaseAdminEntityPayload[],
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const sqlQueryResult = sampleAdminEntitiesQuery(schema, query, offset, limit, resolvedAuthKeys);
  if (sqlQueryResult.isError()) return sqlQueryResult;

  const searchResult = await queryMany<SearchAdminEntitiesItem>(
    database,
    context,
    sqlQueryResult.value,
  );
  if (searchResult.isError()) return searchResult;

  const entitiesValues = searchResult.value;

  return ok(
    entitiesValues.map((it) => ({
      ...resolveAdminEntityInfo(it),
      ...resolveEntityFields(it),
      id: it.uuid,
    })),
  );
}
