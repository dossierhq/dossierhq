import type { ErrorType, Logger, PromiseResult } from '@jonasb/datadata-core';
import type { DatabaseAdapter, Session, Transaction } from '.';

const internalContextSymbol = Symbol('InternalContext');
const sessionContextSymbol = Symbol('SessionContext');

export interface Context2 {
  readonly logger: Logger;
}

export interface TransactionContext<
  TContext extends TransactionContext<any> = TransactionContext<any> // eslint-disable-line @typescript-eslint/no-explicit-any
> extends Context2 {
  readonly transaction: Transaction | null;

  withTransaction<TOk, TError extends ErrorType>(
    callback: (context: TContext) => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Context<TContext extends Context<any> = Context<any>>
  extends TransactionContext<TContext> {
  readonly logger: Logger;
  readonly transaction: Transaction | null;
}

export interface InternalContext extends TransactionContext<InternalContext> {
  [internalContextSymbol]: never;
}

export interface SessionContext extends Context<SessionContext> {
  //TODO remove
  readonly session: Session;
  [sessionContextSymbol]: never;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class TransactionContextImpl<TContext extends TransactionContext<any>>
  implements TransactionContext<TContext>
{
  readonly #databaseAdapter: DatabaseAdapter;
  readonly logger: Logger;
  readonly transaction: Transaction | null;

  constructor(databaseAdapter: DatabaseAdapter, logger: Logger, transaction: Transaction | null) {
    this.#databaseAdapter = databaseAdapter;
    this.logger = logger;
    this.transaction = transaction;
  }

  protected abstract copyWithNewTransaction(transaction: Transaction): TContext;

  async withTransaction<TOk, TError extends ErrorType>(
    callback: (context: TContext) => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError> {
    if (this.transaction) {
      // Already in transaction
      return await this.#databaseAdapter.withNestedTransaction(this.transaction, async () => {
        return callback(this as unknown as TContext);
      });
    }

    return await this.#databaseAdapter.withRootTransaction(async (client) => {
      const context = this.copyWithNewTransaction(client);
      return callback(context);
    });
  }
}

//TODO remove, use TransactionContextImpl instead
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class ContextImpl<TContext extends Context<any>> implements Context<TContext> {
  readonly databaseAdapter: DatabaseAdapter;
  readonly logger: Logger;
  readonly transaction: Transaction | null;

  constructor(databaseAdapter: DatabaseAdapter, logger: Logger, transaction: Transaction | null) {
    this.databaseAdapter = databaseAdapter;
    this.logger = logger;
    this.transaction = transaction;
  }

  protected abstract copyWithNewTransaction(transaction: Transaction): TContext;

  async withTransaction<TOk, TError extends ErrorType>(
    callback: (context: TContext) => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError> {
    if (this.transaction) {
      // Already in transaction
      return await this.databaseAdapter.withNestedTransaction(this.transaction, async () => {
        return callback(this as unknown as TContext);
      });
    }

    return await this.databaseAdapter.withRootTransaction(async (client) => {
      const context = this.copyWithNewTransaction(client);
      return callback(context);
    });
  }
}

export class InternalContextImpl
  extends TransactionContextImpl<InternalContext>
  implements InternalContext
{
  [internalContextSymbol]: never;
  readonly #databaseAdapter: DatabaseAdapter;

  constructor(
    databaseAdapter: DatabaseAdapter,
    logger: Logger,
    transaction: Transaction | null = null
  ) {
    super(databaseAdapter, logger, transaction);
    this.#databaseAdapter = databaseAdapter;
  }

  protected copyWithNewTransaction(transaction: Transaction): InternalContext {
    return new InternalContextImpl(this.#databaseAdapter, this.logger, transaction);
  }
}

export class SessionContextImpl extends ContextImpl<SessionContext> implements SessionContext {
  [sessionContextSymbol]: never;
  readonly session: Session;

  constructor(
    session: Session,
    databaseAdapter: DatabaseAdapter,
    logger: Logger,
    transaction: Transaction | null = null
  ) {
    super(databaseAdapter, logger, transaction);
    this.session = session;
  }

  protected copyWithNewTransaction(transaction: Transaction): SessionContext {
    return new SessionContextImpl(this.session, this.databaseAdapter, this.logger, transaction);
  }
}
