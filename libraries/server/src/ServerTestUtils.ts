import type { Logger } from '@jonasb/datadata-core';
import type { Context, DatabaseAdapter, Transaction } from '.';
import { ContextImpl } from './Context';
import type { ServerImpl } from './Server';

class DummyContextImpl extends ContextImpl<Context> {
  constructor(
    server: ServerImpl,
    databaseAdapter: DatabaseAdapter,
    logger: Logger,
    transaction: Transaction | null
  ) {
    super(server, databaseAdapter, logger, transaction);
  }

  protected copyWithNewTransaction(transaction: Transaction): Context {
    return new DummyContextImpl(this.server, this.databaseAdapter, this.logger, transaction);
  }
}

export function createDummyContext(
  server: ServerImpl,
  databaseAdapter: DatabaseAdapter,
  logger?: Logger
): Context {
  return new DummyContextImpl(server, databaseAdapter, logger ?? createMockLogger(), null);
}

export function createMockLogger(): Logger {
  return {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}
