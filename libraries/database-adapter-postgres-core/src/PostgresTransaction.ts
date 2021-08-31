import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type { Transaction } from '@jonasb/datadata-server';
import type { PostgresDatabaseAdapter } from '.';

export interface PostgresTransaction extends Transaction {
  release(): void;
}

export async function withRootTransaction<TOk, TError extends ErrorType>(
  databaseAdapter: PostgresDatabaseAdapter,
  callback: (transaction: Transaction) => PromiseResult<TOk, TError>
): PromiseResult<TOk, TError> {
  const transaction = await databaseAdapter.createTransaction();
  try {
    await databaseAdapter.query(transaction, 'BEGIN', undefined);
    const result = await callback(transaction);
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
  transaction: Transaction,
  callback: () => PromiseResult<TOk, TError>
): PromiseResult<TOk, TError> {
  const pgTransaction = transaction as PostgresTransaction
  try {
    await databaseAdapter.query(pgTransaction, 'BEGIN', undefined);
    const result = await callback();
    if (result.isOk()) {
      await databaseAdapter.query(pgTransaction, 'COMMIT', undefined);
    } else {
      await databaseAdapter.query(pgTransaction, 'ROLLBACK', undefined);
    }
    return result;
  } catch (e) {
    await databaseAdapter.query(pgTransaction, 'ROLLBACK', undefined);
    throw e;
  }
}
