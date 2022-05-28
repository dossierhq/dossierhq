import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import { buildSqliteSqlQuery } from '@jonasb/datadata-database-adapter';
import { Temporal } from '@js-temporal/polyfill';
import type { AdvisoryLocksTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryMany } from '../QueryFunctions.js';

export async function advisoryLockDeleteExpired(
  database: Database,
  context: TransactionContext
): PromiseResult<{ name: string }[], ErrorType.Generic> {
  const now = Temporal.Now.instant();

  const query = buildSqliteSqlQuery(({ sql }) => {
    sql`DELETE FROM advisory_locks WHERE expires_at <= ${now.epochMilliseconds} RETURNING name`;
  });

  return await queryMany<Pick<AdvisoryLocksTable, 'name'>>(database, context, query);
}
