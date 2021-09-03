import { ErrorType, notOk, ok, Result } from '@jonasb/datadata-core';
import type { SqliteDatabaseAdapter } from '.';
import type { ColumnValue } from './SqliteDatabaseAdapter';

interface ErrorConverter<TRow, TError extends ErrorType> {
  (error: unknown): Result<TRow[], TError | ErrorType.Generic>;
}

function queryCommon<TRow extends ColumnValue[], TError extends ErrorType>(
  adapter: SqliteDatabaseAdapter,
  query: string,
  values: ColumnValue[] | undefined,
  errorConverter: ErrorConverter<TRow, TError> | undefined
): Result<TRow[], TError | ErrorType.Generic> {
  try {
    const rows = adapter.query<TRow>(query, values);
    return ok(rows);
  } catch (error) {
    if (errorConverter) {
      return errorConverter(error);
    }
    return notOk.GenericUnexpectedException(error);
  }
}

export function queryNone<TError extends ErrorType | ErrorType.Generic = ErrorType.Generic>(
  adapter: SqliteDatabaseAdapter,
  query: string,
  values?: ColumnValue[],
  errorConverter?: ErrorConverter<unknown, TError | ErrorType.Generic>
): Result<void, TError | ErrorType.Generic> {
  const result = queryCommon<[], TError>(
    adapter,
    query,
    values,
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

export function queryOne<TRow extends ColumnValue[], TError extends ErrorType = ErrorType.Generic>(
  adapter: SqliteDatabaseAdapter,
  query: string,
  values?: ColumnValue[],
  errorConverter?: ErrorConverter<TRow, TError | ErrorType.Generic>
): Result<TRow, TError | ErrorType.Generic> {
  const result = queryCommon<TRow, TError>(
    adapter,
    query,
    values,
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
