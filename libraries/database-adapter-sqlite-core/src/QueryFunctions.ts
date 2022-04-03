import type { ErrorType, PromiseResult, Result } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import type { SqliteDatabaseAdapter } from '.';
import type { ColumnValue } from './SqliteDatabaseAdapter';
import type { Mutex } from './utils/MutexUtils';

interface ErrorConverter<TRow, TError extends ErrorType> {
  (error: unknown): Result<TRow[], TError | ErrorType.Generic>;
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
  errorConverter: ErrorConverter<TRow, TError> | undefined
): PromiseResult<TRow[], TError | ErrorType.Generic> {
  const { text, values } =
    typeof queryOrQueryAndValues === 'string'
      ? { text: queryOrQueryAndValues, values: undefined }
      : queryOrQueryAndValues;

  const queryAndConvert: () => PromiseResult<TRow[], TError | ErrorType.Generic> = async () => {
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

export async function queryNone<TError extends ErrorType | ErrorType.Generic = ErrorType.Generic>(
  database: Database,
  context: TransactionContext,
  query: QueryOrQueryAndValues,
  errorConverter?: ErrorConverter<unknown, TError | ErrorType.Generic>
): PromiseResult<void, TError | ErrorType.Generic> {
  const result = await queryCommon<[], TError>(
    database,
    context,
    query,
    errorConverter as ErrorConverter<[], TError>
  );
  if (result.isError()) {
    return result;
  }
  const rows = result.value;
  if (rows.length !== 0) {
    return notOk.Generic(`Expected 0 rows, got ${rows.length}`);
  }
  return ok(undefined);
}

export async function queryNoneOrOne<TRow, TError extends ErrorType = ErrorType.Generic>(
  database: Database,
  context: TransactionContext,
  query: QueryOrQueryAndValues,
  errorConverter?: ErrorConverter<TRow, TError | ErrorType.Generic>
): PromiseResult<TRow | null, TError | ErrorType.Generic> {
  const result = await queryCommon<TRow, TError>(
    database,
    context,
    query,
    errorConverter as ErrorConverter<TRow, TError>
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

export async function queryOne<TRow, TError extends ErrorType = ErrorType.Generic>(
  database: Database,
  context: TransactionContext,
  query: QueryOrQueryAndValues,
  errorConverter?: ErrorConverter<TRow, TError | ErrorType.Generic>
): PromiseResult<TRow, TError | ErrorType.Generic> {
  const result = await queryCommon<TRow, TError>(
    database,
    context,
    query,
    errorConverter as ErrorConverter<TRow, TError>
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

export async function queryMany<TRow, TError extends ErrorType = ErrorType.Generic>(
  database: Database,
  context: TransactionContext,
  query: QueryOrQueryAndValues,
  errorConverter?: ErrorConverter<TRow, TError | ErrorType.Generic>
): PromiseResult<TRow[], TError | ErrorType.Generic> {
  const result = await queryCommon<TRow, TError>(
    database,
    context,
    query,
    errorConverter as ErrorConverter<TRow, TError>
  );
  return result;
}
