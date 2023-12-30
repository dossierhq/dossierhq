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

function isSqlite3Error(error: unknown): error is Error {
  // https://github.com/oven-sh/bun/issues/871
  // TODO Bun's error only contain the message, not error codes
  return error instanceof Error;
}

function isFtsVirtualTableConstraintFailed(error: unknown): boolean {
  return isSqlite3Error(error) && error.message === 'constraint failed';
}

function isUniqueViolationOfConstraint(error: unknown, _constraint: UniqueConstraint): boolean {
  return isSqlite3Error(error) && error.message === 'constraint failed';
  // TODO improve when bun returns better error messages
  // if (isSqlite3Error(error) && error.message.startsWith('constraint failed')) {
  //   const qualifiedColumns = constraint.columns.map((column) => `${constraint.table}.${column}`);
  //   const expectedMessage = `UNIQUE constraint failed: ${qualifiedColumns.join(', ')}`;
  //   return error.message === expectedMessage;
  // }
  // return false;
}
