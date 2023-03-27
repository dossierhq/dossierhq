import type { Logger } from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabasePerformanceCallbacks,
  Transaction,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { TransactionContextImpl } from '@dossierhq/database-adapter';

class InitializationContext extends TransactionContextImpl<InitializationContext> {
  constructor(
    databaseAdapter: DatabaseAdapter,
    logger: Logger,
    databasePerformance: DatabasePerformanceCallbacks | null,
    transaction: Transaction | null
  ) {
    super(databaseAdapter, logger, databasePerformance, transaction);
  }

  protected copyWithNewTransaction(
    databaseAdapter: DatabaseAdapter,
    transaction: Transaction
  ): InitializationContext {
    return new InitializationContext(
      databaseAdapter,
      this.logger,
      this.databasePerformance,
      transaction
    );
  }
}

export function createInitializationContext(
  databaseAdapter: DatabaseAdapter,
  logger: Logger,
  databasePerformance: DatabasePerformanceCallbacks | null
): TransactionContext {
  return new InitializationContext(databaseAdapter, logger, databasePerformance, null);
}
