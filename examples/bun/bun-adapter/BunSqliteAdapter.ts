import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type { Context, DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type {
  ColumnValue,
  SqliteDatabaseAdapter,
  UniqueConstraint,
} from '@jonasb/datadata-database-adapter-sqlite-core';
import { createSqliteDatabaseAdapterAdapter } from '@jonasb/datadata-database-adapter-sqlite-core';
import type { Database } from 'bun:sqlite';

export type BunSqliteDatabaseAdapter = DatabaseAdapter;

export function createBunSqliteAdapter(
  context: Context,
  database: Database
): PromiseResult<BunSqliteDatabaseAdapter, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const adapter: SqliteDatabaseAdapter = {
    disconnect: async () => {
      database.close();
    },
    query: async <R>(query: string, values: ColumnValue[] | undefined) => {
      const statement = database.query(query);
      const result = values ? statement.all(...values) : statement.all();

      // TODO finalize statement
      // TODO is the above better than  .prepare().all()?
      // const statement = database.prepare(query, values);
      // let result = statement.all();

      // BEGIN/COMMIT/RELEASE return 0, not []
      if (typeof result === 'number') return [];
      return result as R[];
    },

    isFtsVirtualTableConstraintFailed,
    isUniqueViolationOfConstraint,

    encodeCursor(value) {
      return btoa(unescape(encodeURIComponent(value)));
    },

    decodeCursor(value) {
      return decodeURIComponent(escape(atob(value)));
    },
  };

  return createSqliteDatabaseAdapterAdapter(context, adapter);
}

function isSqlite3Error(error: unknown): error is Error {
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
