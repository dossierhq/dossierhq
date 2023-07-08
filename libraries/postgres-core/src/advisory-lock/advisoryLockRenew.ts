import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type { TransactionContext } from '@dossierhq/database-adapter';
import { buildPostgresSqlQuery } from '@dossierhq/database-adapter';
import type { AdvisoryLocksTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNoneOrOne } from '../QueryFunctions.js';

export async function advisoryLockRenew(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  name: string,
  handle: number,
): PromiseResult<
  { acquiredAt: Date; renewedAt: Date },
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const query = buildPostgresSqlQuery(({ sql }) => {
    sql`UPDATE advisory_locks SET renewed_at = NOW() WHERE name = ${name} AND handle = ${handle} RETURNING acquired_at, renewed_at`;
  });

  const result = await queryNoneOrOne<Pick<AdvisoryLocksTable, 'acquired_at' | 'renewed_at'>>(
    databaseAdapter,
    context,
    query,
  );
  if (result.isError()) return result;

  if (result.value === null) {
    return notOk.NotFound('No such name or handle exists');
  }

  const { acquired_at: acquiredAt, renewed_at: renewedAt } = result.value;
  return ok({
    acquiredAt: new Date(acquiredAt),
    renewedAt: new Date(renewedAt),
  });
}
