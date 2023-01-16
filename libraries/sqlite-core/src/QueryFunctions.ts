import type { ErrorType, PromiseResult, Result } from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type { TransactionContext } from '@dossierhq/database-adapter';
import type { ColumnValue, SqliteDatabaseAdapter } from './SqliteDatabaseAdapter.js';
import type { Mutex } from './utils/MutexUtils.js';

interface ErrorConverter<TOk, TError extends ErrorType> {
  (error: unknown): Result<TOk, TError | typeof ErrorType.Generic>;
}

export interface Database {
  mutex: Mutex;
  adapter: SqliteDatabaseAdapter;
}

export type QueryOrQueryAndValues = string | { text: string; values?: ColumnValue[] };

async function queryCommon<TRow, TError extends ErrorType>(
  database: Database,
  context: TransactionContext,
  queryOrQueryAndValues: QueryOrQueryAndValues,
  errorConverter: ErrorConverter<TRow[], TError> | undefined
): PromiseResult<TRow[], TError | typeof ErrorType.Generic> {
  const { text, values } =
    typeof queryOrQueryAndValues === 'string'
      ? { text: queryOrQueryAndValues, values: undefined }
      : queryOrQueryAndValues;

  const queryAndConvert: () => PromiseResult<
    TRow[],
    TError | typeof ErrorType.Generic
  > = async () => {
    try {
      const rows = await database.adapter.query<TRow>(text, values);
      return ok(rows);
    } catch (error) {
      if (errorConverter) {
        return errorConverter(error);
      }
      return notOk.GenericUnexpectedException(context, error);
    }
  };

  return context.transaction
    ? queryAndConvert()
    : database.mutex.withLock(context, queryAndConvert);
}

export async function queryRun<
  TError extends ErrorType | typeof ErrorType.Generic = typeof ErrorType.Generic
>(
  database: Database,
  context: TransactionContext,
  queryOrQueryAndValues: QueryOrQueryAndValues,
  errorConverter?: ErrorConverter<void, TError>
): PromiseResult<void, TError | typeof ErrorType.Generic> {
  const { text, values } =
    typeof queryOrQueryAndValues === 'string'
      ? { text: queryOrQueryAndValues, values: undefined }
      : queryOrQueryAndValues;

  const queryAndConvert: () => PromiseResult<
    void,
    TError | typeof ErrorType.Generic
  > = async () => {
    try {
      await database.adapter.run(text, values);
      return ok(undefined);
    } catch (error) {
      if (errorConverter) {
        return errorConverter(error);
      }
      return notOk.GenericUnexpectedException(context, error);
    }
  };

  return context.transaction
    ? queryAndConvert()
    : database.mutex.withLock(context, queryAndConvert);
}

export async function queryNoneOrOne<TRow, TError extends ErrorType = typeof ErrorType.Generic>(
  database: Database,
  context: TransactionContext,
  query: QueryOrQueryAndValues,
  errorConverter?: ErrorConverter<TRow, TError | typeof ErrorType.Generic>
): PromiseResult<TRow | null, TError | typeof ErrorType.Generic> {
  const result = await queryCommon<TRow, TError>(
    database,
    context,
    query,
    errorConverter as ErrorConverter<TRow[], TError>
  );
  if (result.isError()) {
    return result;
  }
  const rows = result.value;
  if (rows.length === 0) {
    return ok(null);
  }
  if (rows.length !== 1) {
    return notOk.Generic(`Expected 0-1 rows, got ${rows.length}`);
  }
  return ok(rows[0]);
}

export async function queryOne<TRow, TError extends ErrorType = typeof ErrorType.Generic>(
  database: Database,
  context: TransactionContext,
  query: QueryOrQueryAndValues,
  errorConverter?: ErrorConverter<TRow, TError | typeof ErrorType.Generic>
): PromiseResult<TRow, TError | typeof ErrorType.Generic> {
  const result = await queryCommon<TRow, TError>(
    database,
    context,
    query,
    errorConverter as ErrorConverter<TRow[], TError>
  );
  if (result.isError()) {
    return result;
  }
  const rows = result.value;
  if (rows.length !== 1) {
    return notOk.Generic(`Expected 1 row, got ${rows.length}`);
  }
  return ok(rows[0]);
}

export async function queryMany<TRow, TError extends ErrorType = typeof ErrorType.Generic>(
  database: Database,
  context: TransactionContext,
  query: QueryOrQueryAndValues,
  errorConverter?: ErrorConverter<TRow, TError | typeof ErrorType.Generic>
): PromiseResult<TRow[], TError | typeof ErrorType.Generic> {
  const result = await queryCommon<TRow, TError>(
    database,
    context,
    query,
    errorConverter as ErrorConverter<TRow[], TError>
  );
  return result;
}
