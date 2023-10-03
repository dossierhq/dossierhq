import type { ErrorType, PromiseResult } from '@dossierhq/core';
import {
  createSqliteDatabaseAdapterAdapter,
  type ColumnValue,
  type Context,
  type DatabaseAdapter,
  type SqliteDatabaseAdapter,
  type SqliteDatabaseOptimizationOptions,
  type SqliteDatabaseOptions,
  type UniqueConstraint,
} from '@dossierhq/sqlite-core';
import { LibsqlError, type Client } from '@libsql/client';
import { randomUUID } from 'node:crypto';

export type LibSqlDatabaseAdapter = DatabaseAdapter<SqliteDatabaseOptimizationOptions>;

const PARAMETERS_REGEX = /\?(\d+)/g;

export async function createLibSqlAdapter(
  context: Context,
  client: Client,
  options: SqliteDatabaseOptions,
): PromiseResult<LibSqlDatabaseAdapter, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const adapter: SqliteDatabaseAdapter = {
    disconnect() {
      client.close();
      return Promise.resolve();
    },

    async query<R>(query: string, values: ColumnValue[] | undefined): Promise<R[]> {
      const [convertedQuery, convertedValues] = convertQueryParameters(query, values);
      const result = await client.execute({ sql: convertedQuery, args: convertedValues ?? {} });
      return result.rows as R[];
    },

    async run(query: string, values: ColumnValue[] | undefined) {
      const [convertedQuery, convertedValues] = convertQueryParameters(query, values);
      const result = await client.execute({ sql: convertedQuery, args: convertedValues ?? {} });
      return result.rowsAffected;
    },

    isFtsVirtualTableConstraintFailed,
    isUniqueViolationOfConstraint,

    encodeCursor(value) {
      return Buffer.from(value).toString('base64');
    },

    decodeCursor(value) {
      return Buffer.from(value, 'base64').toString('utf8');
    },

    randomUUID,
  };

  return createSqliteDatabaseAdapterAdapter(context, adapter, options);
}

function isSqliteError(error: unknown): error is LibsqlError {
  return error instanceof LibsqlError || (error instanceof Error && 'code' in error);
}

function isFtsVirtualTableConstraintFailed(error: unknown): boolean {
  return (
    isSqliteError(error) &&
    error.code === 'SQLITE_CONSTRAINT' &&
    error.message === 'SQLITE_CONSTRAINT: constraint failed'
  );
}

function isUniqueViolationOfConstraint(error: unknown, constraint: UniqueConstraint): boolean {
  if (isSqliteError(error) && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    const qualifiedColumns = constraint.columns.map((column) => `${constraint.table}.${column}`);
    const expectedMessage = `UNIQUE constraint failed: ${qualifiedColumns.join(', ')}`;
    if (error.message === expectedMessage) {
      return true;
    }
    return error.message === `${error.code}: ${expectedMessage}`;
  }
  return false;
}

export function convertQueryParameters(
  query: string,
  values: ColumnValue[] | undefined,
): [string, Record<string, ColumnValue> | undefined] {
  if (!values || values.length === 0) {
    return [query, undefined];
  }

  const newQuery = query.replaceAll(PARAMETERS_REGEX, (_, index) => `@p${index}`);
  const newValues: Record<string, ColumnValue> = {};
  for (let i = 0; i < values.length; i++) {
    newValues[`p${i + 1}`] = values[i];
  }

  return [newQuery, newValues];
}
