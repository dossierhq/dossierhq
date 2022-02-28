import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import { buildSqliteSqlQuery } from '@jonasb/datadata-database-adapter';
import { Temporal } from '@js-temporal/polyfill';
import type { SqliteDatabaseAdapter } from '..';
import { AdvisoryLocksUniqueNameConstraint } from '../DatabaseSchema';
import { queryNone } from '../QueryFunctions';

export async function advisoryLockAcquire(
  databaseAdapter: SqliteDatabaseAdapter,
  context: TransactionContext,
  name: string,
  handle: number,
  leaseDuration: number
): PromiseResult<{ acquiredAt: Temporal.Instant }, ErrorType.Conflict | ErrorType.Generic> {
  const now = Temporal.Now.instant();
  const expires_at = now.epochMilliseconds + leaseDuration;

  const query = buildSqliteSqlQuery(({ sql, addValue }) => {
    const nowValue = addValue(now.toString());
    sql`INSERT INTO advisory_locks (name, handle, acquired_at, renewed_at, expires_at, lease_duration)
        VALUES (${name}, ${handle}, ${nowValue}, ${nowValue}, ${expires_at}, ${leaseDuration})`;
  });

  const result = await queryNone(databaseAdapter, context, query, (error) => {
    if (databaseAdapter.isUniqueViolationOfConstraint(error, AdvisoryLocksUniqueNameConstraint)) {
      return notOk.Conflict(`Lock with name '${name}' already exists`);
    }
    return notOk.GenericUnexpectedException(context, error);
  });
  if (result.isError()) return result;

  return ok({ acquiredAt: now });
}
