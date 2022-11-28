import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { Context } from '@jonasb/datadata-database-adapter-sqlite-core';
import type { Database, RunResult, Statement } from 'sqlite3';

type DatabaseConstructor = (new (
  filename: string,
  callback?: (err: Error | null) => void
) => Database) &
  (new (filename: string, mode?: number, callback?: (err: Error | null) => void) => Database);

export async function createDatabase(
  context: Context,
  DatabaseClass: DatabaseConstructor,
  {
    filename,
    mode,
    journalMode,
  }: {
    filename: string | ':memory:';
    mode?: number;
    journalMode?: 'wal';
  }
): PromiseResult<Database, typeof ErrorType.Generic> {
  try {
    const database = await doCreateDatabase(DatabaseClass, filename, mode);
    if (journalMode === 'wal') {
      const walResult = await enableJournalModeWAL(context, database);
      if (walResult.isError()) {
        await closeDatabase(database);
        return walResult;
      }
    }

    return ok(database);
  } catch (error) {
    return notOk.GenericUnexpectedException(context, error);
  }
}

function doCreateDatabase(
  DatabaseClass: DatabaseConstructor,
  filename: string,
  mode?: number
): Promise<Database> {
  if (mode !== undefined) {
    return new Promise<Database>((resolve, reject) => {
      const db = new DatabaseClass(filename, mode, (error: Error | null) => {
        if (error) {
          reject(error);
        }
        resolve(db);
      });
    });
  }

  return new Promise<Database>((resolve, reject) => {
    const db = new DatabaseClass(filename, (error: Error | null) => {
      if (error) {
        reject(error);
      }
      resolve(db);
    });
  });
}

export function closeDatabase(db: Database) {
  return new Promise((resolve, reject) =>
    db.close((error: Error | null) => {
      if (error) {
        reject(error);
      }
      resolve(undefined);
    })
  );
}

async function enableJournalModeWAL(
  context: Context,
  database: Database
): PromiseResult<void, typeof ErrorType.Generic> {
  try {
    await queryAll(database, 'PRAGMA journal_mode=WAL');
    return ok(undefined);
  } catch (error) {
    return notOk.GenericUnexpectedException(context, error);
  }
}

export function queryAll<R>(db: Database, query: string, values: unknown[] = []) {
  return new Promise<R[]>((resolve, reject) =>
    db.all(query, values, function (this: Statement, error: Error | null, rows: R[]) {
      if (error) {
        reject(error);
      }
      resolve(rows as R[]);
    })
  );
}

export function queryRun(db: Database, query: string, values: unknown[] = []) {
  return new Promise<void>((resolve, reject) =>
    db.run(query, values, function (this: RunResult, error: Error | null) {
      if (error) {
        reject(error);
      }
      resolve(undefined);
    })
  );
}
