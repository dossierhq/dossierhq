import { notOk, ok, type ErrorType, type PromiseResult, type Result } from '@dossierhq/core';
import type { TransactionContext } from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter, PostgresQueryResult } from './PostgresDatabaseAdapter.js';
import type { PostgresTransaction } from './PostgresTransaction.js';

type ErrorConverter<TRow, TError extends ErrorType> = (
  error: unknown,
) => Result<PostgresQueryResult<TRow>, TError | typeof ErrorType.Generic>;

type QueryOrQueryAndValues = string | { text: string; values?: unknown[] };

async function queryCommon<TRow, TError extends ErrorType>(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  queryOrQueryAndValues: QueryOrQueryAndValues,
  errorConverter: ErrorConverter<TRow, TError> | undefined,
): PromiseResult<PostgresQueryResult<TRow>, TError | typeof ErrorType.Generic> {
  const { text, values } =
    typeof queryOrQueryAndValues === 'string'
      ? { text: queryOrQueryAndValues, values: undefined }
      : queryOrQueryAndValues;

  const startTime = performance.now();
  try {
    const result = await adapter.query<TRow>(
      context.transaction as PostgresTransaction,
      text,
      values,
    );

    const duration = performance.now() - startTime;
    context.databasePerformance?.onQueryCompleted(text, true, duration);

    return ok(result);
  } catch (error) {
    const duration = performance.now() - startTime;
    context.databasePerformance?.onQueryCompleted(text, false, duration);

    if (errorConverter) {
      return errorConverter(error);
    }
    return notOk.GenericUnexpectedException(context, error);
  }
}

export async function queryNone<
  TError extends ErrorType | typeof ErrorType.Generic = typeof ErrorType.Generic,
>(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  query: QueryOrQueryAndValues,
  errorConverter?: ErrorConverter<unknown, TError | typeof ErrorType.Generic>,
): PromiseResult<void, TError | typeof ErrorType.Generic> {
  const result = await queryCommon<unknown, TError>(
    adapter,
    context,
    query,
    errorConverter as ErrorConverter<unknown, TError>,
  );
  if (result.isError()) return result;
  const rows = result.value.rows;
  if (rows && rows.length !== 0) {
    return notOk.Generic(`Expected 0 rows, got ${rows.length}`);
  }
  return ok(undefined);
}

export async function queryRun<
  TError extends ErrorType | typeof ErrorType.Generic = typeof ErrorType.Generic,
>(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  query: QueryOrQueryAndValues,
  errorConverter?: ErrorConverter<unknown, TError | typeof ErrorType.Generic>,
): PromiseResult<number, TError | typeof ErrorType.Generic> {
  const result = await queryCommon<unknown, TError>(
    adapter,
    context,
    query,
    errorConverter as ErrorConverter<unknown, TError>,
  );
  if (result.isError()) return result;
  const rows = result.value.rows;
  if (rows && rows.length !== 0) {
    return notOk.Generic(`Expected 0 rows, got ${rows.length}`);
  }
  return ok(result.value.rowCount ?? 0);
}

export async function queryNoneOrOne<TRow, TError extends ErrorType = typeof ErrorType.Generic>(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  query: QueryOrQueryAndValues,
  errorConverter?: ErrorConverter<TRow, TError | typeof ErrorType.Generic>,
): PromiseResult<TRow | null, TError | typeof ErrorType.Generic> {
  const result = await queryCommon<TRow, TError>(
    adapter,
    context,
    query,
    errorConverter as ErrorConverter<TRow, TError>,
  );
  if (result.isError()) return result;
  const rows = result.value.rows;
  if (rows.length === 0) {
    return ok(null);
  }
  if (rows.length !== 1) {
    return notOk.Generic(`Expected 0-1 rows, got ${rows.length}`);
  }
  return ok(rows[0]);
}

export async function queryOne<TRow, TError extends ErrorType = typeof ErrorType.Generic>(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  query: QueryOrQueryAndValues,
  errorConverter?: ErrorConverter<TRow, TError | typeof ErrorType.Generic>,
): PromiseResult<TRow, TError | typeof ErrorType.Generic> {
  const result = await queryCommon<TRow, TError>(
    adapter,
    context,
    query,
    errorConverter as ErrorConverter<TRow, TError>,
  );
  if (result.isError()) return result;
  const rows = result.value.rows;
  if (rows.length !== 1) {
    return notOk.Generic(`Expected 1 row, got ${rows.length}`);
  }
  return ok(rows[0]);
}

export async function queryMany<TRow, TError extends ErrorType = typeof ErrorType.Generic>(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  query: QueryOrQueryAndValues,
  errorConverter?: ErrorConverter<TRow, TError | typeof ErrorType.Generic>,
): PromiseResult<TRow[], TError | typeof ErrorType.Generic> {
  const result = await queryCommon<TRow, TError>(
    adapter,
    context,
    query,
    errorConverter as ErrorConverter<TRow, TError>,
  );
  return result.isOk() ? ok(result.value.rows) : result;
}
