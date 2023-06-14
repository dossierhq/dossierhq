import { type ErrorType, type PromiseResult } from '@dossierhq/core';
import {
  type DatabaseEntityIndexesArg,
  type DatabaseResolvedEntityReference,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import { type Database } from '../QueryFunctions.js';
import { updateLatestEntityIndexes } from '../admin-entity/updateLatestEntityIndexes.js';

export async function managementDirtyUpdateLatestIndexes(
  database: Database,
  context: TransactionContext,
  reference: DatabaseResolvedEntityReference,
  entityIndexes: DatabaseEntityIndexesArg
): PromiseResult<void, typeof ErrorType.Generic> {
  return updateLatestEntityIndexes(database, context, reference, entityIndexes, {
    skipDelete: false,
  });
}
