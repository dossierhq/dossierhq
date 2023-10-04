import type { ErrorType, PromiseResult } from '@dossierhq/core';
import {
  createSqliteDatabaseAdapterAdapter,
  type ColumnValue,
  type Context,
  type DatabaseAdapter,
  type SqliteDatabaseAdapter,
  type SqliteDatabaseOptimizationOptions,
  type SqliteDatabaseOptions,
  type SqliteTransactionContext,
  type UniqueConstraint,
} from '@dossierhq/sqlite-core';
import type { Database } from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

export type BetterSqlite3DatabaseAdapter = DatabaseAdapter<SqliteDatabaseOptimizationOptions>;

interface SqliteError extends Error {
  code: string;
  message: string;
  stack: string;
}

const PARAMETERS_REGEX = /\?(\d+)/g;

export async function createBetterSqlite3Adapter(
  context: Context,
  database: Database,
  options: SqliteDatabaseOptions,
): PromiseResult<
  BetterSqlite3DatabaseAdapter,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const adapter: SqliteDatabaseAdapter = {
    disconnect: () => {
      database.close();
      return Promise.resolve();
    },

    createTransaction() {
      return null;
    },

    query: <R>(
      _context: SqliteTransactionContext,
      query: string,
      values: ColumnValue[] | undefined,
    ) => {
      const [convertedQuery, convertedValues] = convertQueryParameters(query, values);
      const statement = database.prepare(convertedQuery);
      const result = convertedValues ? statement.all(convertedValues) : statement.all();
      return Promise.resolve(result as R[]);
    },

    run: (_context: SqliteTransactionContext, query: string, values: ColumnValue[] | undefined) => {
      const [convertedQuery, convertedValues] = convertQueryParameters(query, values);
      const statement = database.prepare(convertedQuery);
      const result = convertedValues ? statement.run(convertedValues) : statement.run();
      return Promise.resolve(result.changes);
    },

    isFtsVirtualTableConstraintFailed,
    isUniqueViolationOfConstraint,

    encodeCursor(value) {
      return Buffer.from(value).toString('base64');
    },

    decodeCursor(value) {
      return Buffer.from(value, 'base64').toString('utf8');
    },

    randomUUID,
  };

  return createSqliteDatabaseAdapterAdapter(context, adapter, options);
}

function isSqliteError(error: unknown): error is SqliteError {
  return error instanceof Error && error.name === 'SqliteError';
}

function isFtsVirtualTableConstraintFailed(error: unknown): boolean {
  return (
    isSqliteError(error) &&
    error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' &&
    error.message === 'constraint failed'
  );
}

function isUniqueViolationOfConstraint(error: unknown, constraint: UniqueConstraint): boolean {
  if (isSqliteError(error) && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    const qualifiedColumns = constraint.columns.map((column) => `${constraint.table}.${column}`);
    const expectedMessage = `UNIQUE constraint failed: ${qualifiedColumns.join(', ')}`;
    return error.message === expectedMessage;
  }
  return false;
}

export function convertQueryParameters(
  query: string,
  values: ColumnValue[] | undefined,
): [string, Record<string, ColumnValue> | undefined] {
  if (!values || values.length === 0) {
    return [query, undefined];
  }

  const newQuery = query.replaceAll(PARAMETERS_REGEX, (_, index) => `@p${index}`);
  const newValues: Record<string, ColumnValue> = {};
  for (let i = 0; i < values.length; i++) {
    newValues[`p${i + 1}`] = values[i];
  }

  return [newQuery, newValues];
}
