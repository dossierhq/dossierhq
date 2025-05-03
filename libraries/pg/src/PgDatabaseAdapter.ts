import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import {
  createPostgresDatabaseAdapterAdapter,
  type PostgresDatabaseAdapter,
  type PostgresDatabaseOptimizationOptions,
  type PostgresTransaction,
} from '@dossierhq/postgres-core';
import { DatabaseError, types as PgTypes, Pool, type PoolClient, type PoolConfig } from 'pg';

PgTypes.setTypeParser(PgTypes.builtins.INT8, BigInt);
// 1016 = _int8 (int8 array)
const parseBigIntArray = PgTypes.getTypeParser<string[]>(1016);
PgTypes.setTypeParser(1016, (it) => (parseBigIntArray(it) as string[]).map(BigInt));

export type PgDatabaseAdapter = DatabaseAdapter<PostgresDatabaseOptimizationOptions>;

interface TransactionWrapper extends PostgresTransaction {
  client: PoolClient;
}

function getPoolClient(transaction: PostgresTransaction): PoolClient {
  return (transaction as TransactionWrapper).client;
}

export function createPostgresAdapter(poolConfig: PoolConfig): PgDatabaseAdapter {
  const pool = new Pool(poolConfig);

  const adapter: PostgresDatabaseAdapter = {
    disconnect: () => pool.end(),

    createTransaction: async () => {
      const client = await pool.connect();
      const transaction: TransactionWrapper = {
        _type: 'Transaction',
        savePointCount: 0,
        client,
        release: () => client.release(),
      };
      return transaction;
    },

    query: async (transaction, query, values) => {
      const result = await (transaction
        ? getPoolClient(transaction).query(query, values)
        : pool.query(query, values));
      return result;
    },

    isUniqueViolationOfConstraint,

    base64Encode(value) {
      return Buffer.from(value).toString('base64');
    },

    base64Decode(value) {
      return Buffer.from(value, 'base64').toString('utf8');
    },
  };

  return createPostgresDatabaseAdapterAdapter(adapter);
}

function isUniqueViolationOfConstraint(error: unknown, constraintName: string): boolean {
  const unique_violation = '23505';
  return (
    error instanceof DatabaseError &&
    error.code === unique_violation &&
    error.constraint === constraintName
  );
}
