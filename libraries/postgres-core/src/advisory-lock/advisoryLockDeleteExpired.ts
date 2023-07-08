import type { ErrorType, PromiseResult } from '@dossierhq/core';
import type { TransactionContext } from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import type { AdvisoryLocksTable } from '../DatabaseSchema.js';
import { queryMany } from '../QueryFunctions.js';

const QUERY =
  'DELETE FROM advisory_locks WHERE renewed_at + lease_duration <= NOW() RETURNING name';

export async function advisoryLockDeleteExpired(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
): PromiseResult<{ name: string }[], typeof ErrorType.Generic> {
  return await queryMany<Pick<AdvisoryLocksTable, 'name'>>(databaseAdapter, context, QUERY);
}
