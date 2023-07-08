import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import type { TransactionContext } from '@dossierhq/database-adapter';
import { queryRun, type Database } from '../QueryFunctions.js';
import type { SqliteDatabaseOptimizationOptions } from '../SqliteDatabaseAdapter.js';

export async function managementOptimize(
  database: Database,
  context: TransactionContext,
  options: SqliteDatabaseOptimizationOptions,
): PromiseResult<void, typeof ErrorType.Generic> {
  const { logger } = context;

  if (options.all || options.fullTextSearchAdmin) {
    logger.info('Starting optimizing admin full text search');
    const start = performance.now();
    const result = await queryRun(
      database,
      context,
      "INSERT INTO entities_latest_fts(entities_latest_fts) VALUES('optimize')",
    );
    if (result.isError()) return result;
    const duration = performance.now() - start;
    logger.info(`Finished optimizing admin full text search in ${duration.toFixed(2)}ms`);
  }

  if (options.all || options.fullTextSearchPublished) {
    logger.info('Starting optimizing published full text search');
    const start = performance.now();
    const result = await queryRun(
      database,
      context,
      "INSERT INTO entities_published_fts(entities_published_fts) VALUES('optimize')",
    );
    if (result.isError()) return result;
    const duration = performance.now() - start;
    logger.info(`Finished optimizing published full text search in ${duration.toFixed(2)}ms`);
  }

  return ok(undefined);
}
