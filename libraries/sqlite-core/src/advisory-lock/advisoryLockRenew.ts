import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type { TransactionContext } from '@dossierhq/database-adapter';
import { buildSqliteSqlQuery } from '@dossierhq/database-adapter';
import type { AdvisoryLocksTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryNoneOrOne } from '../QueryFunctions.js';
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

  const result = await queryNoneOrOne<Pick<AdvisoryLocksTable, 'acquired_at'>>(
    database,
    context,
    query,
  );
  if (result.isError()) return result;

  return result.value !== null
    ? ok({ acquiredAt: new Date(result.value.acquired_at), renewedAt: now })
    : notOk.NotFound('No such name or handle exists');
}
