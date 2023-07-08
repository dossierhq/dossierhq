import type { ErrorType, PromiseResult, Result } from '@dossierhq/core';
import { notOk } from '@dossierhq/core';
import type { Transaction, TransactionContext } from '@dossierhq/database-adapter';
import type { Database } from './QueryFunctions.js';
import { queryRun } from './QueryFunctions.js';

const sqliteTransactionSymbol = Symbol('SqliteTransaction');
export interface SqliteTransaction extends Transaction {
  [sqliteTransactionSymbol]: true;
  savePointCount: number;
}

export async function withRootTransaction<TOk, TError extends ErrorType>(
  database: Database,
  context: TransactionContext,
  childContextFactory: (transaction: Transaction) => TransactionContext,
  callback: (context: TransactionContext) => PromiseResult<TOk, TError>,
): PromiseResult<TOk, TError | typeof ErrorType.Generic> {
  if (context.transaction) {
    return notOk.Generic('Trying to create a root transaction with current transaction');
  }

  const transaction: SqliteTransaction = {
    _type: 'Transaction',
    [sqliteTransactionSymbol]: true,
    savePointCount: 0,
  };
  const childContext = childContextFactory(transaction);
  return await database.mutex.withLock<TOk, TError | typeof ErrorType.Generic>(
    childContext,
    async () => {
      const beginResult = await queryRun(database, childContext, 'BEGIN');
      if (beginResult.isError()) return beginResult;

      let result: Result<TOk, TError | typeof ErrorType.Generic>;
      try {
        result = await callback(childContext);
      } catch (error) {
        result = notOk.GenericUnexpectedException(childContext, error);
      }

      const commitOrRollbackResult = await queryRun(
        database,
        childContext,
        result.isOk() ? 'COMMIT' : 'ROLLBACK',
      );
      if (commitOrRollbackResult.isError()) return commitOrRollbackResult;

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
