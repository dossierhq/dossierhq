import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type { Context, DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type {
  ColumnValue,
  SqliteDatabaseAdapter,
  UniqueConstraint,
} from '@jonasb/datadata-database-adapter-sqlite-core';
import { createSqliteDatabaseAdapterAdapter } from '@jonasb/datadata-database-adapter-sqlite-core';
import initSqlJs from 'sql.js';

export async function createSqlJsAdapter(
  context: Context
): PromiseResult<DatabaseAdapter, ErrorType.BadRequest | ErrorType.Generic> {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  const adapter: SqliteDatabaseAdapter = {
    disconnect: async () => {
      db.close();
    },
    query: async <R>(query: string, values: ColumnValue[] | undefined) => {
      const result: R[] = [];
      const statement = db.prepare(query, values);
      while (statement.step()) {
        const row = statement.getAsObject() as unknown as R;
        result.push(row);
      }
      statement.free();
      return result;
    },
    isUniqueViolationOfConstraint,

    base64Encode(value) {
      return Buffer.from(value).toString('base64');
    },

    base64Decode(value) {
      return Buffer.from(value, 'base64').toString('utf8');
    },
  };

  return createSqliteDatabaseAdapterAdapter(context, adapter);
}

function isUniqueViolationOfConstraint(error: unknown, constraint: UniqueConstraint): boolean {
  if (error instanceof Error) {
    const qualifiedColumns = constraint.columns.map((column) => `${constraint.table}.${column}`);
    const expectedMessage = `UNIQUE constraint failed: ${qualifiedColumns.join(', ')}`;
    return error.message === expectedMessage;
  }
  return false;
}
