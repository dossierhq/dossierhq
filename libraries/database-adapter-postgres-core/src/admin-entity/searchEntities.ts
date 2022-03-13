import type {
  AdminSchema,
  AdminSearchQuery,
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
import type { PostgresDatabaseAdapter } from '..';
import { queryMany } from '../QueryFunctions';
import { resolvePaging } from '../search/Paging';
import type { SearchAdminEntitiesItem } from '../search/QueryGenerator';
import { searchAdminEntitiesQuery } from '../search/QueryGenerator';
import { resolveEntityStatus } from '../utils/CodecUtils';

export async function adminEntitySearchEntities(
  databaseAdapter: PostgresDatabaseAdapter,
  schema: AdminSchema,
  context: TransactionContext,
  query: AdminSearchQuery | undefined,
  paging: Paging | undefined,
  resolvedAuthKeys: ResolvedAuthKey[]
): PromiseResult<DatabaseAdminEntitySearchPayload, ErrorType.BadRequest | ErrorType.Generic> {
  const pagingResult = resolvePaging(paging);
  if (pagingResult.isError()) return pagingResult;
  const { forwards, count } = pagingResult.value;

  const sqlQueryResult = searchAdminEntitiesQuery(
    databaseAdapter,
    schema,
    query,
    pagingResult.value,
    resolvedAuthKeys
  );
  if (sqlQueryResult.isError()) {
    return sqlQueryResult;
  }
  const { cursorExtractor, sqlQuery } = sqlQueryResult.value;

  const searchResult = await queryMany<SearchAdminEntitiesItem>(databaseAdapter, context, sqlQuery);
  if (searchResult.isError()) {
    return searchResult;
  }

  const entitiesValues = searchResult.value;

  const hasExtraPage = entitiesValues.length > count;
  if (hasExtraPage) {
    entitiesValues.splice(count, 1);
  }
  if (!forwards) {
    // Reverse since DESC order returns the rows in the wrong order, we want them in the same order as for forwards pagination
    entitiesValues.reverse();
  }

  return ok({
    hasNextPage: forwards ? hasExtraPage : false,
    hasPreviousPage: forwards ? false : hasExtraPage,
    entities: entitiesValues.map((it) => ({
      id: it.uuid,
      type: it.type,
      name: it.name,
      version: it.version,
      createdAt: it.created_at,
      updatedAt: it.updated_at,
      authKey: it.auth_key,
      status: resolveEntityStatus(it.status),
      fieldValues: it.data,
      cursor: cursorExtractor(it),
    })),
  });
}
