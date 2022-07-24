import { ErrorType, PromiseResult } from "@jonasb/datadata-core";
import type {
  Context,
  DatabaseAdapter,
} from "@jonasb/datadata-database-adapter";
import {
  ColumnValue,
  createSqliteDatabaseAdapterAdapter,
  SqliteDatabaseAdapter,
  UniqueConstraint,
} from "@jonasb/datadata-database-adapter-sqlite-core";
import { Database } from "bun:sqlite";

export type BunSqliteDatabaseAdapter = DatabaseAdapter;

export function createBunSqliteAdapter(
  context: Context,
  database: Database
): PromiseResult<
  BunSqliteDatabaseAdapter,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const adapter: SqliteDatabaseAdapter = {
    disconnect: async () => {
      database.close();
    },
    query: async <R>(query: string, values: ColumnValue[] | undefined) => {
      const statement = database.query(query);
      const result = values ? statement.all(...values) : statement.all();

      // TODO is the above better than  .prepare().all()?
      // const statement = database.prepare(query, values);
      // let result = statement.all();

      // BEGIN/COMMIT/RELEASE return 0, not []
      if (typeof result === "number") return [];
      return result as R[];
    },

    isFtsVirtualTableConstraintFailed,
    isUniqueViolationOfConstraint,

    encodeCursor(value) {
      //TODO how to convert base64 for bun.js?
      return Buffer.from(value).toString("base64");
    },

    decodeCursor(value) {
      //TODO how to convert base64 for bun.js?
      return Buffer.from(value, "base64").toString("utf8");
    },
  };

  return createSqliteDatabaseAdapterAdapter(context, adapter);
}

function isSqlite3Error(error: unknown): error is Error {
  // TODO Bun's error only contain the message, not error codes
  return error instanceof Error;
}

function isFtsVirtualTableConstraintFailed(error: unknown): boolean {
  return isSqlite3Error(error) && error.message === "constraint failed";
}

function isUniqueViolationOfConstraint(
  error: unknown,
  constraint: UniqueConstraint
): boolean {
  if (
    isSqlite3Error(error) &&
    error.message.startsWith("UNIQUE constraint failed")
  ) {
    const qualifiedColumns = constraint.columns.map(
      (column) => `${constraint.table}.${column}`
    );
    const expectedMessage = `UNIQUE constraint failed: ${qualifiedColumns.join(
      ", "
    )}`;
    return error.message === expectedMessage;
  }
  return false;
}
