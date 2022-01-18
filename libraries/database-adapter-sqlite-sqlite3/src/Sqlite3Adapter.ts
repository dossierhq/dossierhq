import type {
  ColumnValue,
  SqliteDatabaseAdapter,
  UniqueConstraint,
} from '@jonasb/datadata-database-adapter-sqlite-core';
import type { Database, Statement } from 'sqlite3';
import sqlite3, { OPEN_CREATE, OPEN_READWRITE } from 'sqlite3';

interface Sqlite3Error {
  code: 'SQLITE_CONSTRAINT';
  errno: number;
  message: string;
  stack: string;
}

function open(filename: string | ':memory:', mode?: number) {
  return new Promise<Database>((resolve, reject) => {
    const db = new sqlite3.Database(
      filename,
      mode ?? OPEN_READWRITE | OPEN_CREATE,
      (error: Error | null) => {
        if (error) {
          reject(error);
        }
        resolve(db);
      }
    );
  });
}

function disconnect(db: Database) {
  return new Promise((resolve, reject) =>
    db.close((error: Error | null) => {
      if (error) {
        reject(error);
      }
      resolve(undefined);
    })
  );
}

function all<R>(db: Database, query: string, values: unknown[] = []) {
  return new Promise<R[]>((resolve, reject) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    db.all(query, values, function (this: Statement, error: Error | null, rows: any[]) {
      if (error) {
        reject(error);
      }
      resolve(rows as R[]);
    })
  );
}

export async function createSqlite3Adapter(
  filename: string | ':memory:',
  mode?: number
): Promise<SqliteDatabaseAdapter> {
  const db = await open(filename, mode);

  const adapter: SqliteDatabaseAdapter = {
    disconnect: async () => {
      await disconnect(db);
    },
    query: async <R>(query: string, values: ColumnValue[] | undefined) => {
      return await all<R>(db, query, values);
    },
    isUniqueViolationOfConstraint,

    base64Encode(value) {
      return Buffer.from(value).toString('base64');
    },

    base64Decode(value) {
      return Buffer.from(value, 'base64').toString('ascii');
    },
  };

  return adapter;
}

function isUniqueViolationOfConstraint(error: unknown, constraint: UniqueConstraint): boolean {
  const sqlite3Error =
    error && typeof error === 'object' && 'errno' in error ? (error as Sqlite3Error) : null;
  if (sqlite3Error?.code === 'SQLITE_CONSTRAINT') {
    const qualifiedColumns = constraint.columns.map((column) => `${constraint.table}.${column}`);
    const expectedMessage = `SQLITE_CONSTRAINT: UNIQUE constraint failed: ${qualifiedColumns.join(
      ', '
    )}`;
    return sqlite3Error.message === expectedMessage;
  }
  return false;
}
