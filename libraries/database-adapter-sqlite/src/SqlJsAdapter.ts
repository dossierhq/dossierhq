import initSqlJs from 'sql.js';
import type { ColumnValue, SqliteDatabaseAdapter, UniqueConstraint } from '.';
import { SCHEMA_DEFINITION_STATEMENTS } from './SchemaDefinition';

export async function createSqlJsAdapter(): Promise<SqliteDatabaseAdapter> {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(SCHEMA_DEFINITION_STATEMENTS.join(';'));

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
  };
  return adapter;
}

function isUniqueViolationOfConstraint(error: unknown, constraint: UniqueConstraint): boolean {
  if (error instanceof Error) {
    const qualifiedColumns = constraint.columns.map((column) => `${constraint.table}.${column}`);
    const expectedMessage = `UNIQUE constraint failed: ${qualifiedColumns.join(', ')}`;
    return error.message === expectedMessage;
  }
  return false;
}
