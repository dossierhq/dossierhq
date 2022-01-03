import type { ErrorType, PromiseResult, Result } from '@jonasb/datadata-core';
import { notOk } from '@jonasb/datadata-core';
import type { Transaction, TransactionContext } from '@jonasb/datadata-database-adapter';
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
  context: TransactionContext,
  transaction: Transaction,
  callback: () => PromiseResult<TOk, TError>
): PromiseResult<TOk, TError | ErrorType.Generic> {
  const sqliteTransaction = transaction as SqliteTransaction;
  const savePointName = `nested${sqliteTransaction.savePointCount++}`;
  try {
    await databaseAdapter.query(`SAVEPOINT ${savePointName}`, undefined);
  } catch (error) {
    return notOk.GenericUnexpectedException(context, error);
  }

  let result: Result<TOk, TError | ErrorType.Generic>;
  try {
    result = await callback();
  } catch (error) {
    result = notOk.GenericUnexpectedException(context, error);
  }

  try {
    if (result.isOk()) {
      await databaseAdapter.query(`RELEASE ${savePointName}`, undefined);
    } else {
      await databaseAdapter.query(`ROLLBACK TO ${savePointName}`, undefined);
    }
  } catch (error) {
    result = notOk.GenericUnexpectedException(context, error);
  }

  return result;
}
