import {
  notOk,
  ok,
  type EntityReference,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import {
  createPostgresSqlQuery,
  type DatabaseEventGetChangelogEventsEntityInfoPayload,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { EntitiesTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNoneOrOne } from '../QueryFunctions.js';

export async function eventGetChangelogEventsEntityInfo(
  database: PostgresDatabaseAdapter,
  context: TransactionContext,
  reference: EntityReference,
): PromiseResult<
  DatabaseEventGetChangelogEventsEntityInfoPayload,
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const { sql, query } = createPostgresSqlQuery();
  sql`SELECT id, auth_key, resolved_auth_key FROM entities WHERE uuid = ${reference.id}`;

  const result = await queryNoneOrOne<Pick<EntitiesTable, 'id' | 'auth_key' | 'resolved_auth_key'>>(
    database,
    context,
    query,
  );
  if (result.isError()) return result;
  if (!result.value) {
    return notOk.NotFound('No such entity');
  }

  const {
    id: entityInternalId,
    auth_key: authKey,
    resolved_auth_key: resolvedAuthKey,
  } = result.value;
  return ok({ entityInternalId, authKey, resolvedAuthKey });
}
