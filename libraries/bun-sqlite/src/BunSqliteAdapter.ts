import type { ErrorType, LoggerContext, PromiseResult } from '@dossierhq/core';
import {
  createSqliteDatabaseAdapterAdapter,
  type ColumnValue,
  type DatabaseAdapter,
  type SqliteDatabaseAdapter,
  type SqliteDatabaseOptimizationOptions,
  type SqliteDatabaseOptions,
  type SqliteTransactionContext,
  type UniqueConstraint,
} from '@dossierhq/sqlite-core';
import type { Database } from 'bun:sqlite';

export type BunSqliteDatabaseAdapter = DatabaseAdapter<SqliteDatabaseOptimizationOptions>;

// TODO this is a copy of @types/bun, remove when new version is released
interface SQLiteError extends Error {
  readonly name: 'SQLiteError';
  errno: number;
  code?: string;
  readonly byteOffset: number;
}

export async function createBunSqliteAdapter(
  context: LoggerContext,
  database: Database,
  options: SqliteDatabaseOptions,
): PromiseResult<BunSqliteDatabaseAdapter, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
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
      const statement = database.prepare<R, ColumnValue[]>(query);
      const result = values ? statement.all(...values) : statement.all();
      return Promise.resolve(result);
    },

    run: (_context: SqliteTransactionContext, query: string, values: ColumnValue[] | undefined) => {
      const statement = database.prepare(query);
      const result = values ? statement.all(...values) : statement.all();
      return Promise.resolve(typeof result === 'number' ? result : 0);
      // TODO https://github.com/oven-sh/bun/issues/2608
    },

    isFtsVirtualTableConstraintFailed,
    isUniqueViolationOfConstraint,

    encodeCursor(value) {
      return Buffer.from(value).toString('base64');
    },

    decodeCursor(value) {
      return Buffer.from(value, 'base64').toString('utf8');
    },

    randomUUID() {
      return crypto.randomUUID();
    },
  };

  return await createSqliteDatabaseAdapterAdapter(context, adapter, options);
}

function isSqlite3Error(error: unknown): error is SQLiteError {
  return error instanceof Error && error.name === 'SQLiteError';
}

function isFtsVirtualTableConstraintFailed(error: unknown): boolean {
  return isSqlite3Error(error) && error.message === 'constraint failed';
}

function isUniqueViolationOfConstraint(error: unknown, constraint: UniqueConstraint): boolean {
  if (isSqlite3Error(error) && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    const qualifiedColumns = constraint.columns.map((column) => `${constraint.table}.${column}`);
    const expectedMessage = `UNIQUE constraint failed: ${qualifiedColumns.join(', ')}`;
    return error.message === expectedMessage;
  }
  return false;
}
