import { notOk, type ErrorType, type PromiseResult, type Result } from '@dossierhq/core';
import type { Transaction, TransactionContext } from '@dossierhq/database-adapter';
import { queryRun, type Database } from './QueryFunctions.js';
import type { AdapterTransaction } from './SqliteDatabaseAdapter.js';
import { withQueryPerformance } from './utils/withQueryPerformance.js';

const sqliteTransactionSymbol = Symbol('SqliteTransaction');

export interface SqliteTransaction extends Transaction {
  [sqliteTransactionSymbol]: true;
  savePointCount: number;
  /** The start of the root transaction */
  transactionTimestamp: Date;
  adapterTransaction: AdapterTransaction | null;
}

export type SqliteTransactionContext = TransactionContext<SqliteTransaction>;

export function getTransactionTimestamp(transaction: Transaction | null): Date {
  if (transaction && sqliteTransactionSymbol in transaction) {
    return (transaction as SqliteTransaction).transactionTimestamp;
  }
  return new Date();
}

export async function withRootTransaction<
  TOk,
  TError extends ErrorType,
  TContext extends TransactionContext,
>(
  database: Database,
  context: TransactionContext,
  childContextFactory: (transaction: Transaction) => TContext,
  callback: (context: TContext) => PromiseResult<TOk, TError>,
): PromiseResult<TOk, TError | typeof ErrorType.Generic> {
  if (context.transaction) {
    return notOk.Generic('Trying to create a root transaction with current transaction');
  }

  const now = new Date();

  const adapterTransaction = database.adapter.createTransaction();

  const transaction: SqliteTransaction = {
    _type: 'Transaction',
    [sqliteTransactionSymbol]: true,
    savePointCount: 0,
    transactionTimestamp: now,
    adapterTransaction,
  };
  const childContext = childContextFactory(transaction);
  return await database.mutex.withLock<TOk, TError | typeof ErrorType.Generic>(
    childContext,
    async () => {
      // BEGIN
      if (adapterTransaction) {
        try {
          await withQueryPerformance(childContext, 'BEGIN', () => adapterTransaction.begin());
        } catch (error) {
          return notOk.GenericUnexpectedException(childContext, error);
        }
      } else {
        const beginResult = await queryRun(database, childContext, 'BEGIN');
        if (beginResult.isError()) return beginResult;
      }

      // transaction body
      let result: Result<TOk, TError | typeof ErrorType.Generic>;
      try {
        result = await callback(childContext);
      } catch (error) {
        result = notOk.GenericUnexpectedException(childContext, error);
      }

      // COMMIT or ROLLBACK
      if (adapterTransaction) {
        try {
          if (result.isOk()) {
            await withQueryPerformance(childContext, 'COMMIT', () => adapterTransaction.commit());
          } else {
            await withQueryPerformance(childContext, 'ROLLBACK', () =>
              adapterTransaction.rollback(),
            );
          }
        } catch (error) {
          result = notOk.GenericUnexpectedException(childContext, error);
        } finally {
          adapterTransaction.close();
        }
      } else {
        const commitOrRollbackResult = await queryRun(
          database,
          childContext,
          result.isOk() ? 'COMMIT' : 'ROLLBACK',
        );
        if (commitOrRollbackResult.isError()) {
          result = commitOrRollbackResult;
        }
      }

      return result;
    },
  );
}

export async function withNestedTransaction<TOk, TError extends ErrorType>(
  database: Database,
  context: TransactionContext,
  transaction: Transaction,
  callback: () => PromiseResult<TOk, TError>,
): PromiseResult<TOk, TError | typeof ErrorType.Generic> {
  const sqliteTransaction = transaction as SqliteTransaction;
  const savePointName = `nested${sqliteTransaction.savePointCount++}`;
  const savePointResult = await queryRun(database, context, `SAVEPOINT ${savePointName}`);
  if (savePointResult.isError()) return savePointResult;

  let result: Result<TOk, TError | typeof ErrorType.Generic>;
  try {
    result = await callback();
  } catch (error) {
    result = notOk.GenericUnexpectedException(context, error);
  }

  const releaseOrRollbackResult = await queryRun(
    database,
    context,
    result.isOk() ? `RELEASE ${savePointName}` : `ROLLBACK TO ${savePointName}`,
  );
  if (releaseOrRollbackResult.isError()) return releaseOrRollbackResult;

  return result;
}
