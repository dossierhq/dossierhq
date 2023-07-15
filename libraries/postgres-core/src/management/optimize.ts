import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import type { TransactionContext } from '@dossierhq/database-adapter';
import type {
  PostgresDatabaseAdapter,
  PostgresDatabaseOptimizationOptions,
} from '../PostgresDatabaseAdapter.js';

export function managementOptimize(
  _databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  _options: PostgresDatabaseOptimizationOptions,
): PromiseResult<void, typeof ErrorType.Generic> {
  context.logger.info('Currently no optimizations are implemented for Postgres');
  return Promise.resolve(ok(undefined));
}
