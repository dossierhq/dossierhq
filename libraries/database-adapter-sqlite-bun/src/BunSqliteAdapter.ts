import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type {
  ColumnValue,
  Context,
  DatabaseAdapter,
  SqliteDatabaseAdapter,
  UniqueConstraint,
} from '@jonasb/datadata-database-adapter-sqlite-core';
import { createSqliteDatabaseAdapterAdapter } from '@jonasb/datadata-database-adapter-sqlite-core';
import type { Database } from 'bun:sqlite';

export type BunSqliteDatabaseAdapter = DatabaseAdapter;

export async function createBunSqliteAdapter(
  context: Context,
  database: Database,
  options: { journalMode?: 'wal' } = {}
): PromiseResult<BunSqliteDatabaseAdapter, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const adapter: SqliteDatabaseAdapter = {
    disconnect: async () => {
      database.close();
    },
    query: async <R>(query: string, values: ColumnValue[] | undefined) => {
      const statement = database.prepare(query, values);
      const result = statement.all();
      statement.finalize();

      // BEGIN/COMMIT/RELEASE return 0, not []
      if (typeof result === 'number' && result === 0) return [];
      return result as R[];
    },
    run: async (query: string, values: ColumnValue[] | undefined) => {
      const statement = database.prepare(query, values);
      statement.run();
      statement.finalize();
    },

    isFtsVirtualTableConstraintFailed,
    isUniqueViolationOfConstraint,

    encodeCursor(value) {
      // TODO this is a slow conversion. Using 'base64' is faster, but not correct atm.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return Buffer.from(value).toString('base64url');
    },

    decodeCursor(value) {
      // TODO this is a slow conversion. Using 'base64' is faster, but not correct atm.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return Buffer.from(value, 'base64url').toString('utf8');
    },

    randomUUID: crypto.randomUUID,
  };

  const adapterAdapterResult = await createSqliteDatabaseAdapterAdapter(context, adapter);

  if (adapterAdapterResult.isOk()) {
    if (options.journalMode === 'wal') {
      await adapter.query('PRAGMA journal_mode=WAL', undefined);
    }
  }

  return adapterAdapterResult;
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
