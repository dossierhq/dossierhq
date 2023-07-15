import type { ErrorType, Logger, PromiseResult } from '@dossierhq/core';
import type { DatabaseAdapter } from './DatabaseAdapter.js';

export interface Context {
  readonly logger: Logger;
}

export interface Transaction {
  _type: 'Transaction';
}

export interface DatabasePerformanceCallbacks {
  onMutexAcquired: (duration: number) => void;
  onQueryCompleted: (query: string, success: boolean, duration: number) => void;
  onRootTransactionAcquired: (duration: number) => void;
  onRootTransactionCompleted: (duration: number) => void;
}

export interface TransactionContext<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TContext extends TransactionContext<TContext> = TransactionContext<any>,
> extends Context {
  readonly transaction: Transaction | null;
  databasePerformance: DatabasePerformanceCallbacks | null;

  withTransaction<TOk, TError extends ErrorType>(
    callback: (context: TContext) => PromiseResult<TOk, TError>,
  ): PromiseResult<TOk, TError | typeof ErrorType.Generic>;
}

export abstract class TransactionContextImpl<TContext extends TransactionContext<TContext>>
  implements TransactionContext<TContext>
{
  readonly #databaseAdapter: DatabaseAdapter;
  readonly logger: Logger;
  readonly transaction: Transaction | null;
  readonly databasePerformance: DatabasePerformanceCallbacks | null;

  constructor(
    databaseAdapter: DatabaseAdapter,
    logger: Logger,
    databasePerformance: DatabasePerformanceCallbacks | null,
    transaction: Transaction | null,
  ) {
    this.#databaseAdapter = databaseAdapter;
    this.logger = logger;
    this.databasePerformance = databasePerformance;
    this.transaction = transaction;
  }

  protected abstract copyWithNewTransaction(
    databaseAdapter: DatabaseAdapter,
    transaction: Transaction,
  ): TContext;

  async withTransaction<TOk, TError extends ErrorType>(
    callback: (context: TContext) => PromiseResult<TOk, TError>,
  ): PromiseResult<TOk, TError | typeof ErrorType.Generic> {
    if (this.transaction) {
      // Already in transaction
      return await this.#databaseAdapter.withNestedTransaction(this, this.transaction, async () => {
        return callback(this as unknown as TContext);
      });
    }

    const startTime = performance.now();
    const result = await this.#databaseAdapter.withRootTransaction(
      this,
      (transaction) => this.copyWithNewTransaction(this.#databaseAdapter, transaction),
      async (context) => {
        const acquireDuration = performance.now() - startTime;
        this.databasePerformance?.onRootTransactionAcquired(acquireDuration);

        return callback(context as unknown as TContext);
      },
    );

    const completeDuration = performance.now() - startTime;
    this.databasePerformance?.onRootTransactionCompleted(completeDuration);

    return result;
  }
}
