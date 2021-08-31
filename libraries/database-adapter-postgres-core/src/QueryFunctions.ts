import { ErrorType, notOk, ok, PromiseResult, Result } from '@jonasb/datadata-core';
import type { Context } from '@jonasb/datadata-server';
import type { PostgresDatabaseAdapter, PostgresTransaction } from '.';

interface ErrorConverter<TRow, TError extends ErrorType> {
  (error: unknown): Result<TRow[], TError | ErrorType.Generic>;
}

async function queryCommon<TRow, TError extends ErrorType>(
  context: Context,
  adapter: PostgresDatabaseAdapter,
  query: string,
  values: unknown[] | undefined,
  errorConverter: ErrorConverter<TRow, TError> | undefined
): PromiseResult<TRow[], TError | ErrorType.Generic> {
  try {
    const rows = await adapter.query<TRow>(
      context.transaction as PostgresTransaction,
      query,
      values
    );
    return ok(rows);
  } catch (error) {
    if (errorConverter) {
      return errorConverter(error);
    }
    return notOk.GenericUnexpectedException(error);
  }
}

export async function queryNone<TError extends ErrorType | ErrorType.Generic = ErrorType.Generic>(
  context: Context,
  adapter: PostgresDatabaseAdapter,
  query: string,
  values?: unknown[],
  errorConverter?: ErrorConverter<unknown, TError | ErrorType.Generic>
): PromiseResult<void, TError | ErrorType.Generic> {
  const result = await queryCommon<unknown, TError>(
    context,
    adapter,
    query,
    values,
    errorConverter as ErrorConverter<unknown, TError>
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
  context: Context,
  adapter: PostgresDatabaseAdapter,
  query: string,
  values?: unknown[],
  errorConverter?: ErrorConverter<TRow, TError | ErrorType.Generic>
): PromiseResult<TRow, TError | ErrorType.Generic> {
  const result = await queryCommon<TRow, TError>(
    context,
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
