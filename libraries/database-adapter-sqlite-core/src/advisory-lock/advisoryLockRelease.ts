import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import { buildSqliteSqlQuery } from '@jonasb/datadata-database-adapter';
import type { AdvisoryLocksTable } from '../DatabaseSchema';
import type { Database } from '../QueryFunctions';
import { queryNoneOrOne } from '../QueryFunctions';

export async function advisoryLockRelease(
  database: Database,
  context: TransactionContext,
  name: string,
  handle: number
): PromiseResult<void, ErrorType.NotFound | ErrorType.Generic> {
  const query = buildSqliteSqlQuery(({ sql }) => {
    sql`DELETE FROM advisory_locks WHERE name = ${name} AND handle = ${handle} RETURNING id`;
  });

  const result = await queryNoneOrOne<Pick<AdvisoryLocksTable, 'id'>>(database, context, query);
  if (result.isError()) return result;

  return result.value !== null ? ok(undefined) : notOk.NotFound('No such name or handle exists');
}
