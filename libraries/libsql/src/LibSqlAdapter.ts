import type { ErrorType, PromiseResult } from '@dossierhq/core';
import {
  createSqliteDatabaseAdapterAdapter,
  type AdapterTransaction,
  type ColumnValue,
  type Context,
  type DatabaseAdapter,
  type SqliteDatabaseAdapter,
  type SqliteDatabaseOptimizationOptions,
  type SqliteDatabaseOptions,
  type SqliteTransactionContext,
  type UniqueConstraint,
} from '@dossierhq/sqlite-core';
import { LibsqlError, type Client, type Transaction } from '@libsql/client';
import { randomUUID } from 'node:crypto';

export type LibSqlDatabaseAdapter = DatabaseAdapter<SqliteDatabaseOptimizationOptions>;

const PARAMETERS_REGEX = /\?(\d+)/g;

class TransactionAdapter implements AdapterTransaction {
  readonly client: Client;
  transaction: Transaction | null = null;

  constructor(client: Client) {
    this.client = client;
  }

  getTransaction() {
    if (!this.transaction) {
      throw new Error('Transaction is not started');
    }
    return this.transaction;
  }

  async begin() {
    this.transaction = await this.client.transaction();
  }

  commit() {
    return this.getTransaction().commit();
  }

  rollback() {
    return this.getTransaction().rollback();
  }

  close() {
    this.getTransaction().close();
  }
}

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

    createTransaction() {
      return new TransactionAdapter(client);
    },

    async query<R>(
      context: SqliteTransactionContext,
      query: string,
      values: ColumnValue[] | undefined,
    ): Promise<R[]> {
      const target = context.transaction
        ? (context.transaction.adapterTransaction as TransactionAdapter).getTransaction()
        : client;
      const [convertedQuery, convertedValues] = convertQueryParameters(query, values);
      const result = await target.execute({ sql: convertedQuery, args: convertedValues ?? {} });
      return result.rows as R[];
    },

    async run(context: SqliteTransactionContext, query: string, values: ColumnValue[] | undefined) {
      const target = context.transaction
        ? (context.transaction.adapterTransaction as TransactionAdapter).getTransaction()
        : client;
      const [convertedQuery, convertedValues] = convertQueryParameters(query, values);
      const result = await target.execute({ sql: convertedQuery, args: convertedValues ?? {} });
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
  if (!isSqliteError(error)) {
    return false;
  }
  const qualifiedColumns = constraint.columns
    .map((column) => `${constraint.table}.${column}`)
    .join(', ');
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    const expectedMessage = `UNIQUE constraint failed: ${qualifiedColumns}`;
    if (error.message === expectedMessage) {
      return true;
    }
    return error.message === `${error.code}: ${expectedMessage}`;
  } else if (error.code === 'SQLITE_CONSTRAINT') {
    const expectedMessage = `${error.code}: SQLite error: UNIQUE constraint failed: ${qualifiedColumns}`;
    return error.message === expectedMessage;
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
