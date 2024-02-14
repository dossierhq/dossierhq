import type { ErrorType, Logger, PromiseResult } from '@dossierhq/core';
import {
  TransactionContextImpl,
  type DatabaseAdapter,
  type DatabasePerformanceCallbacks,
  type Session,
  type Transaction,
  type TransactionContext,
} from '@dossierhq/database-adapter';

export interface InternalContext extends TransactionContext {
  withTransaction<TOk, TError extends ErrorType>(
    callback: (context: InternalContext) => PromiseResult<TOk, TError>,
  ): PromiseResult<TOk, TError | typeof ErrorType.Generic>;
}

export interface SessionContext<TSession extends Session = Session> extends TransactionContext {
  readonly session: TSession;
  readonly defaultAuthKeys: readonly string[];

  withTransaction<TOk, TError extends ErrorType>(
    callback: (context: SessionContext<TSession>) => PromiseResult<TOk, TError>,
  ): PromiseResult<TOk, TError | typeof ErrorType.Generic>;
}

export class InternalContextImpl
  extends TransactionContextImpl<InternalContext>
  implements InternalContext
{
  constructor(
    databaseAdapter: DatabaseAdapter,
    logger: Logger,
    databasePerformance: DatabasePerformanceCallbacks | null,
    transaction: Transaction | null = null,
  ) {
    super(databaseAdapter, logger, databasePerformance, transaction);
  }

  protected copyWithNewTransaction(
    databaseAdapter: DatabaseAdapter,
    transaction: Transaction,
  ): InternalContext {
    return new InternalContextImpl(
      databaseAdapter,
      this.logger,
      this.databasePerformance,
      transaction,
    );
  }
}

export class SessionContextImpl
  extends TransactionContextImpl<SessionContext>
  implements SessionContext
{
  readonly session: Session;
  readonly defaultAuthKeys: readonly string[];

  constructor(
    session: Session,
    defaultAuthKeys: readonly string[],
    databaseAdapter: DatabaseAdapter,
    logger: Logger,
    databasePerformance: DatabasePerformanceCallbacks | null,
    transaction: Transaction | null = null,
  ) {
    super(databaseAdapter, logger, databasePerformance, transaction);
    this.session = session;
    this.defaultAuthKeys = defaultAuthKeys;
  }

  protected copyWithNewTransaction(
    databaseAdapter: DatabaseAdapter,
    transaction: Transaction,
  ): SessionContext {
    return new SessionContextImpl(
      this.session,
      this.defaultAuthKeys,
      databaseAdapter,
      this.logger,
      this.databasePerformance,
      transaction,
    );
  }
}
