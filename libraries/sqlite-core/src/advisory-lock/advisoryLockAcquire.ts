import { notOk, ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import { buildSqliteSqlQuery, type TransactionContext } from '@dossierhq/database-adapter';
import { AdvisoryLocksUniqueNameConstraint } from '../DatabaseSchema.js';
import { queryRun, type Database } from '../QueryFunctions.js';
import { getTransactionTimestamp } from '../SqliteTransaction.js';

export async function advisoryLockAcquire(
  database: Database,
  context: TransactionContext,
  name: string,
  handle: number,
  leaseDuration: number,
): PromiseResult<{ acquiredAt: Date }, typeof ErrorType.Conflict | typeof ErrorType.Generic> {
  const now = getTransactionTimestamp(context.transaction);
  const expires_at = now.getTime() + leaseDuration;

  const query = buildSqliteSqlQuery(({ sql, addValue }) => {
    const nowValue = addValue(now.toISOString());
    sql`INSERT INTO advisory_locks (name, handle, acquired_at, renewed_at, expires_at, lease_duration)
        VALUES (${name}, ${handle}, ${nowValue}, ${nowValue}, ${expires_at}, ${leaseDuration})`;
  });

  const result = await queryRun(database, context, query, (error) => {
    if (database.adapter.isUniqueViolationOfConstraint(error, AdvisoryLocksUniqueNameConstraint)) {
      return notOk.Conflict(`Lock with name '${name}' already exists`);
    }
    return notOk.GenericUnexpectedException(context, error);
  });
  if (result.isError()) return result;

  return ok({ acquiredAt: now });
}
