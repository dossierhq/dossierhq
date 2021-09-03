import initSqlJs from 'sql.js';
import type { ColumnValue, SqliteDatabaseAdapter } from '.';

export async function createSqlJsAdapter(): Promise<SqliteDatabaseAdapter> {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(schemaSql);

  const adapter: SqliteDatabaseAdapter = {
    disconnect: async () => {
      db.close();
    },
    query: <R>(query: string, values: ColumnValue[] | undefined) => {
      const result = db.exec(query, values);
      if (result.length === 0) {
        return [];
      }
      //TODO check length > 1
      return result[0].values as unknown as R[];
    },
  };
  return adapter;
}

const schemaSql = `
PRAGMA foreign_keys=TRUE;

CREATE TABLE subjects (
  id INTEGER PRIMARY KEY,
  uuid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  CONSTRAINT subjects_pkey UNIQUE (uuid)
);

CREATE TABLE principals (
  id INTEGER PRIMARY KEY,
  provider TEXT NOT NULL,
  identifier TEXT NOT NULL,
  subjects_id INTEGER NOT NULL,
  CONSTRAINT principals_pkey UNIQUE (provider,identifier),
  FOREIGN KEY (subjects_id) REFERENCES subjects(id) ON DELETE CASCADE
);
`;
