import type { Logger } from '@jonasb/datadata-core';
import type { DatabaseAdapter, Transaction, TransactionContext } from '.';
import { TransactionContextImpl } from './Context';

class DummyContextImpl extends TransactionContextImpl<TransactionContext> {
  constructor(databaseAdapter: DatabaseAdapter, logger: Logger, transaction: Transaction | null) {
    super(databaseAdapter, logger, transaction);
  }

  protected copyWithNewTransaction(
    databaseAdapter: DatabaseAdapter,
    transaction: Transaction
  ): TransactionContext {
    return new DummyContextImpl(databaseAdapter, this.logger, transaction);
  }
}

export function createDummyContext(
  databaseAdapter: DatabaseAdapter,
  logger?: Logger
): TransactionContext {
  return new DummyContextImpl(databaseAdapter, logger ?? createMockLogger(), null);
}

export function createMockLogger(): Logger {
  return {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}
