import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type { Context, DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type {
  ColumnValue,
  SqliteDatabaseAdapter,
  UniqueConstraint,
} from '@jonasb/datadata-database-adapter-sqlite-core';
import { createSqliteDatabaseAdapterAdapter } from '@jonasb/datadata-database-adapter-sqlite-core';
import type { Database } from 'sql.js';

export interface SqlJsPlatformAdapter {
  randomUUID(): string;
}

export async function createSqlJsAdapter(
  context: Context,
  database: Database,
  platformAdapter: SqlJsPlatformAdapter
): PromiseResult<DatabaseAdapter, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
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

    isFtsVirtualTableConstraintFailed,
    isUniqueViolationOfConstraint,

    encodeCursor(value) {
      return btoa(unescape(encodeURIComponent(value)));
    },

    decodeCursor(value) {
      return decodeURIComponent(escape(atob(value)));
    },
    randomUUID: platformAdapter.randomUUID,
  };

  return createSqliteDatabaseAdapterAdapter(context, adapter);
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
