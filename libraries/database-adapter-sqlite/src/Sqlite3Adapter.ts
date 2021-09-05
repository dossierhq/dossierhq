import sqlite3 from 'sqlite3';
import type { RunResult, Statement } from 'sqlite3';
import type { ColumnValue, SqliteDatabaseAdapter } from '.';
import { SCHEMA_DEFINITION } from './SchemaDefinition';

export async function createSqlite3Adapter(): Promise<SqliteDatabaseAdapter> {
  const db = new sqlite3.Database(':memory:');
  const schemaResult = await new Promise((resolve, reject) =>
    db.run(SCHEMA_DEFINITION, (result: RunResult, error: Error | null) => {
      if (error) {
        reject(error);
      }
      resolve(result);
    })
  );
  console.log('XXX schema', schemaResult);

  const adapter: SqliteDatabaseAdapter = {
    disconnect: async () => {
      await new Promise((resolve, reject) =>
        db.close((error: Error | null) => {
          if (error) {
            reject(error);
          }
          resolve(undefined);
        })
      );
    },
    query: async <R>(query: string, values: ColumnValue[] | undefined) => {
      const result = await new Promise<R[]>((resolve, reject) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        db.all(query, values, function (this: Statement, error: Error | null, rows: any[]) {
          if (error) {
            reject(error);
          }
          resolve(rows as R[]);
        })
      );
      return result;
    },
  };
  return adapter;
}
