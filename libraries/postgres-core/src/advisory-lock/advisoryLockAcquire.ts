import { notOk, ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import { buildPostgresSqlQuery, type TransactionContext } from '@dossierhq/database-adapter';
import { UniqueConstraints, type AdvisoryLocksTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryOne } from '../QueryFunctions.js';

export async function advisoryLockAcquire(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  name: string,
  handle: number,
  leaseDuration: number,
): PromiseResult<{ acquiredAt: Date }, typeof ErrorType.Conflict | typeof ErrorType.Generic> {
  const query = buildPostgresSqlQuery(({ sql }) => {
    sql`INSERT INTO advisory_locks (name, handle, lease_duration)
        VALUES (${name}, ${handle}, make_interval(secs => ${leaseDuration / 1000}))
        RETURNING acquired_at`;
  });

  const result = await queryOne<Pick<AdvisoryLocksTable, 'acquired_at'>, typeof ErrorType.Conflict>(
    databaseAdapter,
    context,
    query,
    (error) => {
      if (
        databaseAdapter.isUniqueViolationOfConstraint(
          error,
          UniqueConstraints.advisory_locks_name_key,
        )
      ) {
        return notOk.Conflict(`Lock with name '${name}' already exists`);
      }
      return notOk.GenericUnexpectedException(context, error);
    },
  );
  if (result.isError()) return result;
  const { acquired_at: acquiredAt } = result.value;

  return ok({ acquiredAt: new Date(acquiredAt) });
}
