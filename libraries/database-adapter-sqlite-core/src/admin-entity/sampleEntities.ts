import type { AdminQuery, AdminSchema, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdminEntityPayload,
  ResolvedAuthKey,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import type { Database } from '../QueryFunctions.js';
import { queryMany } from '../QueryFunctions.js';
import type { SearchAdminEntitiesItem } from '../search/QueryGenerator.js';
import { sampleAdminEntitiesQuery } from '../search/QueryGenerator.js';
import { resolveEntityStatus } from '../utils/CodecUtils.js';

export async function adminEntitySampleEntities(
  database: Database,
  schema: AdminSchema,
  context: TransactionContext,
  query: AdminQuery | undefined,
  offset: number,
  limit: number,
  resolvedAuthKeys: ResolvedAuthKey[]
): PromiseResult<
  DatabaseAdminEntityPayload[],
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const sqlQueryResult = sampleAdminEntitiesQuery(schema, query, offset, limit, resolvedAuthKeys);
  if (sqlQueryResult.isError()) return sqlQueryResult;

  const searchResult = await queryMany<SearchAdminEntitiesItem>(
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
      version: it.version,
      createdAt: new Date(it.created_at),
      updatedAt: new Date(it.updated_at),
      authKey: it.auth_key,
      status: resolveEntityStatus(it.status),
      fieldValues: JSON.parse(it.fields),
    }))
  );
}
