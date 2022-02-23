import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import { buildPostgresSqlQuery } from '@jonasb/datadata-database-adapter';
import { Temporal } from '@js-temporal/polyfill';
import type { PostgresDatabaseAdapter } from '..';
import type { AdvisoryLocksTable } from '../DatabaseSchema';
import { queryNoneOrOne } from '../QueryFunctions';

export async function advisoryLockRenew(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  name: string,
  handle: number
): PromiseResult<
  { acquiredAt: Temporal.Instant; renewedAt: Temporal.Instant },
  ErrorType.NotFound | ErrorType.Generic
> {
  const query = buildPostgresSqlQuery(({ sql }) => {
    sql`UPDATE advisory_locks SET renewed_at = NOW() WHERE name = ${name} AND handle = ${handle} RETURNING acquired_at, renewed_at`;
  });

  const result = await queryNoneOrOne<Pick<AdvisoryLocksTable, 'acquired_at' | 'renewed_at'>>(
    databaseAdapter,
    context,
    query
  );
  if (result.isError()) return result;

  if (result.value === null) {
    return notOk.NotFound('No such name or handle exists');
  }

  const { acquired_at: acquiredAt, renewed_at: renewedAt } = result.value;
  return ok({
    acquiredAt: Temporal.Instant.from(acquiredAt),
    renewedAt: Temporal.Instant.from(renewedAt),
  });
}
