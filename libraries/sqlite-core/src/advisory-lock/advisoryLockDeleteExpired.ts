import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { buildSqliteSqlQuery, type TransactionContext } from '@dossierhq/database-adapter';
import type { AdvisoryLocksTable } from '../DatabaseSchema.js';
import { queryMany, type Database } from '../QueryFunctions.js';

export async function advisoryLockDeleteExpired(
  database: Database,
  context: TransactionContext,
): PromiseResult<{ name: string }[], typeof ErrorType.Generic> {
  const now = Date.now();

  const query = buildSqliteSqlQuery(({ sql }) => {
    sql`DELETE FROM advisory_locks WHERE expires_at <= ${now} RETURNING name`;
  });

  return await queryMany<Pick<AdvisoryLocksTable, 'name'>>(database, context, query);
}
