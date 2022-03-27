import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type { Context, DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type {
  ColumnValue,
  SqliteDatabaseAdapter,
  UniqueConstraint,
} from '@jonasb/datadata-database-adapter-sqlite-core';
import { createSqliteDatabaseAdapterAdapter } from '@jonasb/datadata-database-adapter-sqlite-core';
import type { Database, Statement } from 'sqlite3';
import sqlite3, { OPEN_CREATE, OPEN_READWRITE } from 'sqlite3';

export type Sqlite3DatabaseAdapter = DatabaseAdapter;

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
  context: Context,
  filename: string | ':memory:',
  mode?: number
): PromiseResult<Sqlite3DatabaseAdapter, ErrorType.BadRequest | ErrorType.Generic> {
  const db = await open(filename, mode);

  const adapter: SqliteDatabaseAdapter = {
    disconnect: async () => {
      await disconnect(db);
    },
    query: async <R>(query: string, values: ColumnValue[] | undefined) => {
      return await all<R>(db, query, values);
    },

    isFtsVirtualTableConstraintFailed,
    isUniqueViolationOfConstraint,

    encodeCursor(value) {
      return Buffer.from(value).toString('base64');
    },

    decodeCursor(value) {
      return Buffer.from(value, 'base64').toString('utf8');
    },
  };

  return createSqliteDatabaseAdapterAdapter(context, adapter);
}

function isSqlite3Error(error: unknown): error is Sqlite3Error {
  return !!error && typeof error === 'object' && 'errno' in error;
}

function isFtsVirtualTableConstraintFailed(error: unknown): boolean {
  return (
    isSqlite3Error(error) &&
    error.code === 'SQLITE_CONSTRAINT' &&
    error.message === 'SQLITE_CONSTRAINT: constraint failed'
  );
}

function isUniqueViolationOfConstraint(error: unknown, constraint: UniqueConstraint): boolean {
  if (isSqlite3Error(error) && error.code === 'SQLITE_CONSTRAINT') {
    const qualifiedColumns = constraint.columns.map((column) => `${constraint.table}.${column}`);
    const expectedMessage = `SQLITE_CONSTRAINT: UNIQUE constraint failed: ${qualifiedColumns.join(
      ', '
    )}`;
    return error.message === expectedMessage;
  }
  return false;
}
