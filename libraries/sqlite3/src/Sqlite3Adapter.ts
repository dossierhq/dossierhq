import type { ErrorType, PromiseResult } from '@dossierhq/core';
import type {
  ColumnValue,
  Context,
  DatabaseAdapter,
  SqliteDatabaseAdapter,
  SqliteDatabaseOptimizationOptions,
  SqliteDatabaseOptions,
  UniqueConstraint,
} from '@dossierhq/sqlite-core';
import { createSqliteDatabaseAdapterAdapter } from '@dossierhq/sqlite-core';
import { randomUUID } from 'node:crypto';
import type { Database } from 'sqlite3';
import { closeDatabase, queryAll, queryRun } from './SqliteUtils.js';

export type Sqlite3DatabaseAdapter = DatabaseAdapter<SqliteDatabaseOptimizationOptions>;

interface Sqlite3Error {
  code: 'SQLITE_CONSTRAINT';
  errno: number;
  message: string;
  stack: string;
}

export async function createSqlite3Adapter(
  context: Context,
  database: Database,
  options: SqliteDatabaseOptions
): PromiseResult<Sqlite3DatabaseAdapter, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const adapter: SqliteDatabaseAdapter = {
    disconnect: async () => {
      await closeDatabase(database);
    },
    query: async <R>(query: string, values: ColumnValue[] | undefined) => {
      return await queryAll<R>(database, query, values);
    },
    run: async (query: string, values: ColumnValue[] | undefined) => {
      return await queryRun(database, query, values);
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

function isSqlite3Error(error: unknown): error is Sqlite3Error {
  return !!error && typeof error === 'object' && 'errno' in error;
}

function isFtsVirtualTableConstraintFailed(error: unknown): boolean {
  return (
    isSqlite3Error(error) &&
    error.code === 'SQLITE_CONSTRAINT' &&
    error.message === 'SQLITE_CONSTRAINT: constraint failed'
  );
}

function isUniqueViolationOfConstraint(error: unknown, constraint: UniqueConstraint): boolean {
  if (isSqlite3Error(error) && error.code === 'SQLITE_CONSTRAINT') {
    const qualifiedColumns = constraint.columns.map((column) => `${constraint.table}.${column}`);
    const expectedMessage = `SQLITE_CONSTRAINT: UNIQUE constraint failed: ${qualifiedColumns.join(
      ', '
    )}`;
    return error.message === expectedMessage;
  }
  return false;
}
