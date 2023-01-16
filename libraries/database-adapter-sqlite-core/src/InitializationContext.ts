import type { Logger } from '@dossierhq/core';
import type { DatabaseAdapter, Transaction, TransactionContext } from '@dossierhq/database-adapter';
import { TransactionContextImpl } from '@dossierhq/database-adapter';

class InitializationContext extends TransactionContextImpl<InitializationContext> {
  constructor(databaseAdapter: DatabaseAdapter, logger: Logger, transaction: Transaction | null) {
    super(databaseAdapter, logger, transaction);
  }

  protected copyWithNewTransaction(
    databaseAdapter: DatabaseAdapter,
    transaction: Transaction
  ): InitializationContext {
    return new InitializationContext(databaseAdapter, this.logger, transaction);
  }
}

export function createInitializationContext(
  databaseAdapter: DatabaseAdapter,
  logger: Logger
): TransactionContext {
  return new InitializationContext(databaseAdapter, logger, null);
}
