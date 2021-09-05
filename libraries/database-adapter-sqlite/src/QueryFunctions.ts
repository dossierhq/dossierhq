import type { ErrorType, PromiseResult, Result } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { SqliteDatabaseAdapter } from '.';
import type { ColumnValue } from './SqliteDatabaseAdapter';

interface ErrorConverter<TRow, TError extends ErrorType> {
  (error: unknown): Result<TRow[], TError | ErrorType.Generic>;
}

async function queryCommon<TRow, TError extends ErrorType>(
  adapter: SqliteDatabaseAdapter,
  query: string,
  values: ColumnValue[] | undefined,
  errorConverter: ErrorConverter<TRow, TError> | undefined
): PromiseResult<TRow[], TError | ErrorType.Generic> {
  try {
    const rows = await adapter.query<TRow>(query, values);
    return ok(rows);
  } catch (error) {
    if (errorConverter) {
      return errorConverter(error);
    }
    return notOk.GenericUnexpectedException(error);
  }
}

export async function queryNone<TError extends ErrorType | ErrorType.Generic = ErrorType.Generic>(
  adapter: SqliteDatabaseAdapter,
  query: string,
  values?: ColumnValue[],
  errorConverter?: ErrorConverter<unknown, TError | ErrorType.Generic>
): PromiseResult<void, TError | ErrorType.Generic> {
  const result = await queryCommon<[], TError>(
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

export async function queryOne<TRow, TError extends ErrorType = ErrorType.Generic>(
  adapter: SqliteDatabaseAdapter,
  query: string,
  values?: ColumnValue[],
  errorConverter?: ErrorConverter<TRow, TError | ErrorType.Generic>
): PromiseResult<TRow, TError | ErrorType.Generic> {
  const result = await queryCommon<TRow, TError>(
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
