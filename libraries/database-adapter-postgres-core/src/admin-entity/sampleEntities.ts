import type { AdminQuery, AdminSchema, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdminEntityPayload,
  ResolvedAuthKey,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import type { PostgresDatabaseAdapter } from '..';
import { queryMany } from '../QueryFunctions';
import type { SearchAdminEntitiesItem } from '../search/QueryGenerator';
import { sampleAdminEntitiesQuery } from '../search/QueryGenerator';
import { resolveEntityStatus } from '../utils/CodecUtils';

export async function adminEntitySampleEntities(
  databaseAdapter: PostgresDatabaseAdapter,
  schema: AdminSchema,
  context: TransactionContext,
  query: AdminQuery | undefined,
  offset: number,
  limit: number,
  resolvedAuthKeys: ResolvedAuthKey[]
): PromiseResult<DatabaseAdminEntityPayload[], ErrorType.BadRequest | ErrorType.Generic> {
  const sqlQueryResult = sampleAdminEntitiesQuery(schema, query, offset, limit, resolvedAuthKeys);
  if (sqlQueryResult.isError()) return sqlQueryResult;

  const searchResult = await queryMany<SearchAdminEntitiesItem>(
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
      version: it.version,
      createdAt: it.created_at,
      updatedAt: it.updated_at,
      authKey: it.auth_key,
      status: resolveEntityStatus(it.status),
      fieldValues: it.data,
    }))
  );
}
