import type { ErrorType, PromiseResult, Result } from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type { TransactionContext } from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from './PostgresDatabaseAdapter.js';
import type { PostgresTransaction } from './PostgresTransaction.js';

interface ErrorConverter<TRow, TError extends ErrorType> {
  (error: unknown): Result<TRow[], TError | typeof ErrorType.Generic>;
}

type QueryOrQueryAndValues = string | { text: string; values?: unknown[] };

async function queryCommon<TRow, TError extends ErrorType>(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  queryOrQueryAndValues: QueryOrQueryAndValues,
  errorConverter: ErrorConverter<TRow, TError> | undefined
): PromiseResult<TRow[], TError | typeof ErrorType.Generic> {
  const { text, values } =
    typeof queryOrQueryAndValues === 'string'
      ? { text: queryOrQueryAndValues, values: undefined }
      : queryOrQueryAndValues;

  try {
    const rows = await adapter.query<TRow>(
      context.transaction as PostgresTransaction,
      text,
      values
    );
    return ok(rows);
  } catch (error) {
    if (errorConverter) {
      return errorConverter(error);
    }
    return notOk.GenericUnexpectedException(context, error);
  }
}

export async function queryNone<
  TError extends ErrorType | typeof ErrorType.Generic = typeof ErrorType.Generic
>(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  query: QueryOrQueryAndValues,
  errorConverter?: ErrorConverter<unknown, TError | typeof ErrorType.Generic>
): PromiseResult<void, TError | typeof ErrorType.Generic> {
  const result = await queryCommon<unknown, TError>(
    adapter,
    context,
    query,
    errorConverter as ErrorConverter<unknown, TError>
  );
  if (result.isError()) {
    return result;
  }
  const rows = result.value;
  if (rows && rows.length !== 0) {
    return notOk.Generic(`Expected 0 rows, got ${rows.length}`);
  }
  return ok(undefined);
}

export async function queryNoneOrOne<TRow, TError extends ErrorType = typeof ErrorType.Generic>(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  query: QueryOrQueryAndValues,
  errorConverter?: ErrorConverter<TRow, TError | typeof ErrorType.Generic>
): PromiseResult<TRow | null, TError | typeof ErrorType.Generic> {
  const result = await queryCommon<TRow, TError>(
    adapter,
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

export async function queryOne<TRow, TError extends ErrorType = typeof ErrorType.Generic>(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  query: QueryOrQueryAndValues,
  errorConverter?: ErrorConverter<TRow, TError | typeof ErrorType.Generic>
): PromiseResult<TRow, TError | typeof ErrorType.Generic> {
  const result = await queryCommon<TRow, TError>(
    adapter,
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

export async function queryMany<TRow, TError extends ErrorType = typeof ErrorType.Generic>(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  query: QueryOrQueryAndValues,
  errorConverter?: ErrorConverter<TRow, TError | typeof ErrorType.Generic>
): PromiseResult<TRow[], TError | typeof ErrorType.Generic> {
  const result = await queryCommon<TRow, TError>(
    adapter,
    context,
    query,
    errorConverter as ErrorConverter<TRow, TError>
  );
  return result;
}
