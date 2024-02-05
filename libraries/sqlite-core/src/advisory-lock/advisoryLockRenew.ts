import { notOk, ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import { buildSqliteSqlQuery, type TransactionContext } from '@dossierhq/database-adapter';
import type { AdvisoryLocksTable } from '../DatabaseSchema.js';
import { queryNoneOrOne, type Database } from '../QueryFunctions.js';
import { getTransactionTimestamp } from '../SqliteTransaction.js';

export async function advisoryLockRenew(
  database: Database,
  context: TransactionContext,
  name: string,
  handle: number,
): PromiseResult<
  { acquiredAt: Date; renewedAt: Date },
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const now = getTransactionTimestamp(context.transaction);

  const query = buildSqliteSqlQuery(({ sql }) => {
    sql`UPDATE advisory_locks SET renewed_at = ${now.toISOString()}, expires_at = ${now.getTime()} + lease_duration WHERE name = ${name} AND handle = ${handle} RETURNING acquired_at`;
  });

  const updateResult = await queryNoneOrOne<Pick<AdvisoryLocksTable, 'acquired_at'>>(
    database,
    context,
    query,
  );
  if (updateResult.isError()) return updateResult;

  if (updateResult.value !== null) {
    return ok({ acquiredAt: new Date(updateResult.value.acquired_at), renewedAt: now });
  }

  const existingResult = await queryNoneOrOne<Pick<AdvisoryLocksTable, 'id'>>(
    database,
    context,
    buildSqliteSqlQuery(({ sql }) => {
      sql`SELECT id FROM advisory_locks WHERE name = ${name}`;
    }),
  );
  if (existingResult.isError()) return existingResult;

  return notOk.NotFound(
    existingResult.value
      ? `Invalid handle used for renewing lock '${name}'`
      : `Failed renewing lock, no advisory lock with the name '${name}' exists`,
  );
}
