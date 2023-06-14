import { type ErrorType, type PromiseResult } from '@dossierhq/core';
import type {
  DatabaseEntityIndexesArg,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { updateLatestEntityIndexes } from '../admin-entity/updateLatestEntityIndexes.js';

export async function managementDirtyUpdateLatestIndexes(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  reference: DatabaseResolvedEntityReference,
  entityIndexes: DatabaseEntityIndexesArg
): PromiseResult<void, typeof ErrorType.Generic> {
  return updateLatestEntityIndexes(databaseAdapter, context, reference, entityIndexes, {
    skipDelete: false,
  });
}
