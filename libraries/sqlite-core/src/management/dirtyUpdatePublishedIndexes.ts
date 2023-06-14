import { notOk, type ErrorType, type PromiseResult } from '@dossierhq/core';
import {
  type DatabaseEntityIndexesArg,
  type DatabaseResolvedEntityReference,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import { type Database } from '../QueryFunctions.js';

export async function managementDirtyUpdatePublishedIndexes(
  _database: Database,
  _context: TransactionContext,
  _reference: DatabaseResolvedEntityReference,
  _entityIndexes: DatabaseEntityIndexesArg
): PromiseResult<void, typeof ErrorType.Generic> {
  return notOk.Generic('TODO');
}
