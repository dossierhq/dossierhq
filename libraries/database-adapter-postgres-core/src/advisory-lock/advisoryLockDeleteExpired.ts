import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import type { PostgresDatabaseAdapter } from '..';
import type { AdvisoryLocksTable } from '../DatabaseSchema';
import { queryMany } from '../QueryFunctions';

const QUERY =
  'DELETE FROM advisory_locks WHERE renewed_at + lease_duration <= NOW() RETURNING name';

export async function advisoryLockDeleteExpired(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext
): PromiseResult<{ name: string }[], ErrorType.Generic> {
  return await queryMany<Pick<AdvisoryLocksTable, 'name'>>(databaseAdapter, context, QUERY);
}
