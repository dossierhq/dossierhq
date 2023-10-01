import type { AdminEntityQuery, AdminSchema, ErrorType, PromiseResult } from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type {
  DatabaseAdminEntitySearchPayload,
  DatabasePagingInfo,
  ResolvedAuthKey,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { Database } from '../QueryFunctions.js';
import { queryMany } from '../QueryFunctions.js';
import type { SearchAdminEntitiesItem } from '../search/QueryGenerator.js';
import { searchAdminEntitiesQuery } from '../search/QueryGenerator.js';
import { resolveAdminEntityInfo, resolveEntityFields } from '../utils/CodecUtils.js';
import { convertConnectionPayload } from '../utils/ConnectionUtils.js';

export async function adminEntitySearchEntities(
  database: Database,
  schema: AdminSchema,
  context: TransactionContext,
  query: AdminEntityQuery | undefined,
  paging: DatabasePagingInfo,
  resolvedAuthKeys: ResolvedAuthKey[],
): PromiseResult<
  DatabaseAdminEntitySearchPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const sqlQueryResult = searchAdminEntitiesQuery(
    database,
    schema,
    query,
    paging,
    resolvedAuthKeys,
  );
  if (sqlQueryResult.isError()) return sqlQueryResult;
  const { cursorExtractor, sqlQuery } = sqlQueryResult.value;

  const connectionResult = await queryMany<SearchAdminEntitiesItem>(database, context, sqlQuery);
  if (connectionResult.isError()) return connectionResult;
  const rows = connectionResult.value;

  return ok(
    convertConnectionPayload(paging, rows, (row) => ({
      ...resolveAdminEntityInfo(row),
      ...resolveEntityFields(row),
      id: row.uuid,
      cursor: cursorExtractor(row),
    })),
  );
}
