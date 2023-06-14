import { notOk, type ErrorType, type PromiseResult } from '@dossierhq/core';
import type {
  DatabaseEntityIndexesArg,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';

export async function managementDirtyUpdatePublishedIndexes(
  _databaseAdapter: PostgresDatabaseAdapter,
  _context: TransactionContext,
  _reference: DatabaseResolvedEntityReference,
  _entityIndexes: DatabaseEntityIndexesArg
): PromiseResult<void, typeof ErrorType.Generic> {
  return notOk.Generic('TODO');
}
