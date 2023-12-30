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
import type { Database } from 'sql.js';

export type SqlJsDatabaseAdapter = DatabaseAdapter<SqliteDatabaseOptimizationOptions>;

export async function createSqlJsAdapter(
  context: LoggerContext,
  database: Database,
  options: SqliteDatabaseOptions,
): PromiseResult<SqlJsDatabaseAdapter, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
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
      const result: R[] = [];
      const statement = database.prepare(query, values);
      while (statement.step()) {
        const row = statement.getAsObject() as unknown as R;
        result.push(row);
      }
      statement.free();
      return Promise.resolve(result);
    },

    run: (_context: SqliteTransactionContext, query: string, values: ColumnValue[] | undefined) => {
      database.run(query, values);
      return Promise.resolve(database.getRowsModified());
    },

    isFtsVirtualTableConstraintFailed,
    isUniqueViolationOfConstraint,

    encodeCursor(value) {
      return btoa(unescape(encodeURIComponent(value)));
    },

    decodeCursor(value) {
      return decodeURIComponent(escape(atob(value)));
    },

    randomUUID: () => crypto.randomUUID(),
  };

  return createSqliteDatabaseAdapterAdapter(context, adapter, options);
}

function isFtsVirtualTableConstraintFailed(error: unknown): boolean {
  return error instanceof Error && error.message === 'constraint failed';
}

function isUniqueViolationOfConstraint(error: unknown, constraint: UniqueConstraint): boolean {
  if (error instanceof Error) {
    const qualifiedColumns = constraint.columns.map((column) => `${constraint.table}.${column}`);
    const expectedMessage = `UNIQUE constraint failed: ${qualifiedColumns.join(', ')}`;
    return error.message === expectedMessage;
  }
  return false;
}
