import { notOk, type ErrorType, type PromiseResult } from '@dossierhq/core';
import type { TransactionContext } from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';

export function managementSyncGetHeadEventId(
  _databaseAdapter: PostgresDatabaseAdapter,
  _context: TransactionContext,
): PromiseResult<string | null, typeof ErrorType.Generic> {
  return Promise.resolve(notOk.Generic('Not implemented'));
}
