import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import { buildPostgresSqlQuery } from '@jonasb/datadata-database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import type { AdvisoryLocksTable } from '../DatabaseSchema.js';
import { queryNoneOrOne } from '../QueryFunctions.js';

export async function advisoryLockRelease(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  name: string,
  handle: number
): PromiseResult<void, typeof ErrorType.NotFound | typeof ErrorType.Generic> {
  const query = buildPostgresSqlQuery(({ sql }) => {
    sql`DELETE FROM advisory_locks WHERE name = ${name} AND handle = ${handle} RETURNING id`;
  });

  const result = await queryNoneOrOne<Pick<AdvisoryLocksTable, 'id'>>(
    databaseAdapter,
    context,
    query
  );
  if (result.isError()) return result;

  return result.value !== null ? ok(undefined) : notOk.NotFound('No such name or handle exists');
}
