import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import { buildSqliteSqlQuery } from '@jonasb/datadata-database-adapter';
import type { AdvisoryLocksTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryMany } from '../QueryFunctions.js';

export async function advisoryLockDeleteExpired(
  database: Database,
  context: TransactionContext
): PromiseResult<{ name: string }[], typeof ErrorType.Generic> {
  const now = Date.now();

  const query = buildSqliteSqlQuery(({ sql }) => {
    sql`DELETE FROM advisory_locks WHERE expires_at <= ${now} RETURNING name`;
  });

  return await queryMany<Pick<AdvisoryLocksTable, 'name'>>(database, context, query);
}
