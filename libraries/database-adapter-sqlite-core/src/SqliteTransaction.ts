import type { ErrorType, PromiseResult, Result } from '@jonasb/datadata-core';
import { notOk } from '@jonasb/datadata-core';
import type { Transaction, TransactionContext } from '@jonasb/datadata-database-adapter';
import type { Database } from './QueryFunctions';
import { queryNone } from './QueryFunctions';

const sqliteTransactionSymbol = Symbol('SqliteTransaction');
export interface SqliteTransaction extends Transaction {
  [sqliteTransactionSymbol]: true;
  savePointCount: number;
}

export async function withRootTransaction<TOk, TError extends ErrorType>(
  database: Database,
  context: TransactionContext,
  callback: (transaction: Transaction) => PromiseResult<TOk, TError>
): PromiseResult<TOk, TError | ErrorType.Generic> {
  if (context.transaction) {
    return notOk.Generic('Trying to create a root transaction with current transaction');
  }

  //TODO probably the same mutex needs to be run in queryCommon for queries outside of transaction
  const transaction: SqliteTransaction = {
    _type: 'Transaction',
    [sqliteTransactionSymbol]: true,
    savePointCount: 0,
  };
  return await database.mutex.withLock<TOk, TError | ErrorType.Generic>(context, async () => {
    const beginResult = await queryNone(database, context, 'BEGIN');
    if (beginResult.isError()) return beginResult;

    let result: Result<TOk, TError | ErrorType.Generic>;
    try {
      result = await callback(transaction);
    } catch (error) {
      result = notOk.GenericUnexpectedException(context, error);
    }

    const commitOrRollbackResult = await queryNone(
      database,
      context,
      result.isOk() ? 'COMMIT' : 'ROLLBACK'
    );
    if (commitOrRollbackResult.isError()) return commitOrRollbackResult;

    return result;
  });
}

export async function withNestedTransaction<TOk, TError extends ErrorType>(
  database: Database,
  context: TransactionContext,
  transaction: Transaction,
  callback: () => PromiseResult<TOk, TError>
): PromiseResult<TOk, TError | ErrorType.Generic> {
  const sqliteTransaction = transaction as SqliteTransaction;
  const savePointName = `nested${sqliteTransaction.savePointCount++}`;
  const savePointResult = await queryNone(database, context, `SAVEPOINT ${savePointName}`);
  if (savePointResult.isError()) return savePointResult;

  let result: Result<TOk, TError | ErrorType.Generic>;
  try {
    result = await callback();
  } catch (error) {
    result = notOk.GenericUnexpectedException(context, error);
  }

  const releaseOrRollbackResult = await queryNone(
    database,
    context,
    result.isOk() ? `RELEASE ${savePointName}` : `ROLLBACK TO ${savePointName}`
  );
  if (releaseOrRollbackResult.isError()) return releaseOrRollbackResult;

  return result;
}
