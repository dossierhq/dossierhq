import { notOk, ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import { buildPostgresSqlQuery, type TransactionContext } from '@dossierhq/database-adapter';
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

  const updateResult = await queryNoneOrOne<Pick<AdvisoryLocksTable, 'acquired_at' | 'renewed_at'>>(
    databaseAdapter,
    context,
    query,
  );
  if (updateResult.isError()) return updateResult;

  if (updateResult.value !== null) {
    const { acquired_at: acquiredAt, renewed_at: renewedAt } = updateResult.value;
    return ok({
      acquiredAt: new Date(acquiredAt),
      renewedAt: new Date(renewedAt),
    });
  }

  const existingResult = await queryNoneOrOne<Pick<AdvisoryLocksTable, 'id'>>(
    databaseAdapter,
    context,
    buildPostgresSqlQuery(({ sql }) => {
      sql`SELECT id FROM advisory_locks WHERE name = ${name}`;
    }),
  );
  if (existingResult.isError()) return existingResult;

  return notOk.NotFound(
    existingResult.value
      ? `Invalid handle used for renewing lock '${name}'`
      : `Failed renewing lock, no advisory lock with the name '${name}' exists`,
  );
}
