import type {
  AdminQuery,
  AdminSchema,
  ErrorType,
  Paging,
  PromiseResult,
} from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdminEntitySearchPayload,
  ResolvedAuthKey,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { Temporal } from '@js-temporal/polyfill';
import type { SqliteDatabaseAdapter } from '..';
import { queryMany } from '../QueryFunctions';
import type { SearchAdminEntitiesItem } from '../search/QueryGenerator';
import { searchAdminEntitiesQuery } from '../search/QueryGenerator';
import { resolveEntityStatus } from '../utils/CodecUtils';

export async function adminEntitySearchEntities(
  databaseAdapter: SqliteDatabaseAdapter,
  schema: AdminSchema,
  context: TransactionContext,
  query: AdminQuery | undefined,
  paging: Paging | undefined,
  resolvedAuthKeys: ResolvedAuthKey[]
): PromiseResult<DatabaseAdminEntitySearchPayload, ErrorType.BadRequest | ErrorType.Generic> {
  const sqlQueryResult = searchAdminEntitiesQuery(schema, query, paging, resolvedAuthKeys);
  if (sqlQueryResult.isError()) {
    return sqlQueryResult;
  }
  const { cursorExtractor, pagingCount, isForwards } = sqlQueryResult.value;

  const searchResult = await queryMany<SearchAdminEntitiesItem>(
    databaseAdapter,
    context,
    sqlQueryResult.value
  );
  if (searchResult.isError()) {
    return searchResult;
  }

  const entitiesValues = searchResult.value;

  const hasExtraPage = entitiesValues.length > pagingCount;
  if (hasExtraPage) {
    entitiesValues.splice(pagingCount, 1);
  }
  if (!isForwards) {
    // Reverse since DESC order returns the rows in the wrong order, we want them in the same order as for forwards pagination
    entitiesValues.reverse();
  }

  return ok({
    hasNextPage: isForwards ? hasExtraPage : false,
    hasPreviousPage: isForwards ? false : hasExtraPage,
    entities: entitiesValues.map((it) => ({
      id: it.uuid,
      type: it.type,
      name: it.name,
      version: it.version,
      createdAt: Temporal.Instant.from(it.created_at),
      updatedAt: Temporal.Instant.from(it.updated_at),
      authKey: it.auth_key,
      status: resolveEntityStatus(it.status),
      fieldValues: JSON.parse(it.fields),
      cursor: cursorExtractor(it),
    })),
  });
}
