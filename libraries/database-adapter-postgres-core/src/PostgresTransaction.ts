import type { ErrorType, PromiseResult, Result } from '@dossierhq/core';
import { notOk } from '@dossierhq/core';
import type { Transaction, TransactionContext } from '@jonasb/datadata-database-adapter';
import type { PostgresDatabaseAdapter } from './PostgresDatabaseAdapter.js';

export interface PostgresTransaction extends Transaction {
  release(): void;
  savePointCount: number;
}

export async function withRootTransaction<TOk, TError extends ErrorType>(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  childContextFactory: (transaction: Transaction) => TransactionContext,
  callback: (context: TransactionContext) => PromiseResult<TOk, TError>
): PromiseResult<TOk, TError | typeof ErrorType.Generic> {
  if (context.transaction) {
    return notOk.Generic('Trying to create a root transaction with current transaction');
  }
  const transaction = await databaseAdapter.createTransaction();
  const childContext = childContextFactory(transaction);
  try {
    await databaseAdapter.query(transaction, 'BEGIN', undefined);
    const result = await callback(childContext);
    if (result.isOk()) {
      await databaseAdapter.query(transaction, 'COMMIT', undefined);
    } else {
      await databaseAdapter.query(transaction, 'ROLLBACK', undefined);
    }
    return result;
  } catch (e) {
    await databaseAdapter.query(transaction, 'ROLLBACK', undefined);
    throw e;
  } finally {
    transaction.release();
  }
}

export async function withNestedTransaction<TOk, TError extends ErrorType>(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  transaction: Transaction,
  callback: () => PromiseResult<TOk, TError>
): PromiseResult<TOk, TError | typeof ErrorType.Generic> {
  //TODO need mutex to ensure not called from other "contexts" in the same transaction?
  const pgTransaction = transaction as PostgresTransaction;
  const savePointName = `nested${pgTransaction.savePointCount++}`;
  try {
    await databaseAdapter.query(pgTransaction, `SAVEPOINT ${savePointName}`, undefined);
  } catch (error) {
    return notOk.GenericUnexpectedException(context, error);
  }

  let result: Result<TOk, TError | typeof ErrorType.Generic>;
  try {
    result = await callback();
  } catch (error) {
    result = notOk.GenericUnexpectedException(context, error);
  }

  try {
    if (result.isOk()) {
      await databaseAdapter.query(pgTransaction, `RELEASE SAVEPOINT ${savePointName}`, undefined);
    } else {
      await databaseAdapter.query(
        pgTransaction,
        `ROLLBACK TO SAVEPOINT ${savePointName}`,
        undefined
      );
    }
  } catch (error) {
    result = notOk.GenericUnexpectedException(context, error);
  }

  return result;
}
