import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import { buildSqliteSqlQuery } from '@jonasb/datadata-database-adapter';
import type { AdvisoryLocksTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryNoneOrOne } from '../QueryFunctions.js';

export async function advisoryLockRelease(
  database: Database,
  context: TransactionContext,
  name: string,
  handle: number
): PromiseResult<void, typeof ErrorType.NotFound | typeof ErrorType.Generic> {
  const query = buildSqliteSqlQuery(({ sql }) => {
    sql`DELETE FROM advisory_locks WHERE name = ${name} AND handle = ${handle} RETURNING id`;
  });

  const result = await queryNoneOrOne<Pick<AdvisoryLocksTable, 'id'>>(database, context, query);
  if (result.isError()) return result;

  return result.value !== null ? ok(undefined) : notOk.NotFound('No such name or handle exists');
}
