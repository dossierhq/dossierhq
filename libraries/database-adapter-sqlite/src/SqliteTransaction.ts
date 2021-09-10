import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type { Transaction } from '@jonasb/datadata-server';
import type { SqliteDatabaseAdapter } from './SqliteDatabaseAdapter';

const sqliteTransactionSymbol = Symbol('SqliteTransaction');
export interface SqliteTransaction extends Transaction {
  [sqliteTransactionSymbol]: true;
}

export async function withRootTransaction<TOk, TError extends ErrorType>(
  databaseAdapter: SqliteDatabaseAdapter,
  callback: (transaction: Transaction) => PromiseResult<TOk, TError>
): PromiseResult<TOk, TError> {
  //TODO create mutex
  const transaction: SqliteTransaction = { _type: 'Transaction', [sqliteTransactionSymbol]: true };
  try {
    await databaseAdapter.query('BEGIN', undefined);
    const result = await callback(transaction);
    if (result.isOk()) {
      await databaseAdapter.query('COMMIT', undefined);
    } else {
      await databaseAdapter.query('ROLLBACK', undefined);
    }
    return result;
  } catch (e) {
    await databaseAdapter.query('ROLLBACK', undefined);
    throw e;
  }
}

export async function withNestedTransaction<TOk, TError extends ErrorType>(
  databaseAdapter: SqliteDatabaseAdapter,
  transaction: Transaction,
  callback: () => PromiseResult<TOk, TError>
): PromiseResult<TOk, TError> {
  const _sqliteTransaction = transaction as SqliteTransaction;
  try {
    await databaseAdapter.query('BEGIN', undefined);
    const result = await callback();
    if (result.isOk()) {
      await databaseAdapter.query('COMMIT', undefined);
    } else {
      await databaseAdapter.query('ROLLBACK', undefined);
    }
    return result;
  } catch (e) {
    await databaseAdapter.query('ROLLBACK', undefined);
    throw e;
  }
}
