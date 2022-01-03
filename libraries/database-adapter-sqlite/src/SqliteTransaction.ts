import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type { Transaction } from '@jonasb/datadata-database-adapter';
import type { SqliteDatabaseAdapter } from './SqliteDatabaseAdapter';

const sqliteTransactionSymbol = Symbol('SqliteTransaction');
export interface SqliteTransaction extends Transaction {
  [sqliteTransactionSymbol]: true;
  savePointCount: number;
}

export async function withRootTransaction<TOk, TError extends ErrorType>(
  databaseAdapter: SqliteDatabaseAdapter,
  callback: (transaction: Transaction) => PromiseResult<TOk, TError>
): PromiseResult<TOk, TError> {
  //TODO create mutex, probably the same mutex needs to be run in queryCommon for queries outside of transaction
  const transaction: SqliteTransaction = {
    _type: 'Transaction',
    [sqliteTransactionSymbol]: true,
    savePointCount: 0,
  };
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
  const sqliteTransaction = transaction as SqliteTransaction;
  const savePointName = `nested${sqliteTransaction.savePointCount++}`;
  try {
    await databaseAdapter.query(`SAVEPOINT ${savePointName}`, undefined);
    const result = await callback();
    if (result.isOk()) {
      await databaseAdapter.query(`RELEASE ${savePointName}`, undefined);
    } else {
      await databaseAdapter.query(`ROLLBACK TO ${savePointName}`, undefined);
    }
    return result;
  } catch (e) {
    await databaseAdapter.query(`ROLLBACK TO ${savePointName}`, undefined);
    throw e;
  }
}
