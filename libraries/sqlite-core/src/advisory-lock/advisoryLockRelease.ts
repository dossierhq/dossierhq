import { notOk, ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import { buildSqliteSqlQuery, type TransactionContext } from '@dossierhq/database-adapter';
import type { AdvisoryLocksTable } from '../DatabaseSchema.js';
import { queryNoneOrOne, type Database } from '../QueryFunctions.js';

export async function advisoryLockRelease(
  database: Database,
  context: TransactionContext,
  name: string,
  handle: number,
): PromiseResult<void, typeof ErrorType.NotFound | typeof ErrorType.Generic> {
  type Row = Pick<AdvisoryLocksTable, 'id'>;
  const query = buildSqliteSqlQuery(({ sql }) => {
    sql`DELETE FROM advisory_locks WHERE name = ${name} AND handle = ${handle} RETURNING id`;
  });

  const deleteResult = await queryNoneOrOne<Row>(database, context, query);
  if (deleteResult.isError()) return deleteResult;

  if (deleteResult.value !== null) {
    return ok(undefined);
  }

  const existingResult = await queryNoneOrOne<Row>(
    database,
    context,
    buildSqliteSqlQuery(({ sql }) => {
      sql`SELECT id FROM advisory_locks WHERE name = ${name}`;
    }),
  );
  if (existingResult.isError()) return existingResult;

  return notOk.NotFound(
    existingResult.value
      ? `Invalid handle used for releasing lock '${name}'`
      : `No advisory lock with the name '${name}' exists`,
  );
}
