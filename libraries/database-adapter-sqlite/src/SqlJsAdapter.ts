import initSqlJs from 'sql.js';
import type { ColumnValue, SqliteDatabaseAdapter } from '.';
import { SCHEMA_DEFINITION } from './SchemaDefinition';

export async function createSqlJsAdapter(): Promise<SqliteDatabaseAdapter> {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(SCHEMA_DEFINITION);

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
  };
  return adapter;
}
