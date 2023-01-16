import type { ErrorType, Logger, PromiseResult } from '@dossierhq/core';
import type { DatabaseAdapter } from './DatabaseAdapter.js';

export interface Context {
  readonly logger: Logger;
}

export interface Transaction {
  _type: 'Transaction';
}

export interface TransactionContext<
  TContext extends TransactionContext<any> = TransactionContext<any> // eslint-disable-line @typescript-eslint/no-explicit-any
> extends Context {
  readonly transaction: Transaction | null;

  withTransaction<TOk, TError extends ErrorType>(
    callback: (context: TContext) => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError | typeof ErrorType.Generic>;
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

  protected abstract copyWithNewTransaction(
    databaseAdapter: DatabaseAdapter,
    transaction: Transaction
  ): TContext;

  async withTransaction<TOk, TError extends ErrorType>(
    callback: (context: TContext) => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError | typeof ErrorType.Generic> {
    if (this.transaction) {
      // Already in transaction
      return await this.#databaseAdapter.withNestedTransaction(this, this.transaction, async () => {
        return callback(this as unknown as TContext);
      });
    }

    return await this.#databaseAdapter.withRootTransaction(
      this,
      (transaction) => this.copyWithNewTransaction(this.#databaseAdapter, transaction),
      async (context) => {
        return callback(context as unknown as TContext);
      }
    );
  }
}
