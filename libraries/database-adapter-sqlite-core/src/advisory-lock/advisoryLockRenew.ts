import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import { buildSqliteSqlQuery } from '@jonasb/datadata-database-adapter';
import { Temporal } from '@js-temporal/polyfill';
import type { AdvisoryLocksTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryNoneOrOne } from '../QueryFunctions.js';

export async function advisoryLockRenew(
  database: Database,
  context: TransactionContext,
  name: string,
  handle: number
): PromiseResult<
  { acquiredAt: Temporal.Instant; renewedAt: Temporal.Instant },
  ErrorType.NotFound | ErrorType.Generic
> {
  const now = Temporal.Now.instant();

  const query = buildSqliteSqlQuery(({ sql }) => {
    sql`UPDATE advisory_locks SET renewed_at = ${now.toString()}, expires_at = ${
      now.epochMilliseconds
    } + lease_duration WHERE name = ${name} AND handle = ${handle} RETURNING acquired_at`;
  });

  const result = await queryNoneOrOne<Pick<AdvisoryLocksTable, 'acquired_at'>>(
    database,
    context,
    query
  );
  if (result.isError()) return result;

  return result.value !== null
    ? ok({ acquiredAt: Temporal.Instant.from(result.value.acquired_at), renewedAt: now })
    : notOk.NotFound('No such name or handle exists');
}
