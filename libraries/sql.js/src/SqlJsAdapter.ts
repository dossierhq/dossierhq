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
import type { Database } from 'sql.js';

export type SqlJsDatabaseAdapter = DatabaseAdapter<SqliteDatabaseOptimizationOptions>;

export async function createSqlJsAdapter(
  context: Context,
  database: Database,
  options: SqliteDatabaseOptions,
): PromiseResult<SqlJsDatabaseAdapter, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const adapter: SqliteDatabaseAdapter = {
    disconnect: async () => {
      database.close();
    },

    query: async <R>(query: string, values: ColumnValue[] | undefined) => {
      const result: R[] = [];
      const statement = database.prepare(query, values);
      while (statement.step()) {
        const row = statement.getAsObject() as unknown as R;
        result.push(row);
      }
      statement.free();
      return result;
    },

    run: async (query: string, values: ColumnValue[] | undefined) => {
      database.run(query, values);
      return database.getRowsModified();
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
