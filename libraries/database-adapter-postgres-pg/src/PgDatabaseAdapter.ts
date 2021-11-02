import type {
  PostgresDatabaseAdapter,
  PostgresTransaction,
} from '@jonasb/datadata-database-adapter-postgres-core';
import { createPostgresDatabaseAdapterAdapter } from '@jonasb/datadata-database-adapter-postgres-core';
import type { DatabaseAdapter } from '@jonasb/datadata-server';
import { Temporal } from '@js-temporal/polyfill';
import type { PoolClient, PoolConfig } from 'pg';
import { DatabaseError, Pool, types as PgTypes } from 'pg';

PgTypes.setTypeParser(PgTypes.builtins.INT8, BigInt);
// 1016 = _int8 (int8 array)
PgTypes.setTypeParser(1016, (value) => PgTypes.arrayParser(value, BigInt));
PgTypes.setTypeParser(PgTypes.builtins.TIMESTAMPTZ, (value) => {
  if (value === '-infinity') return Number.NEGATIVE_INFINITY;
  if (value === 'infinity') return Number.POSITIVE_INFINITY;
  return Temporal.Instant.from(value);
});

interface TransactionWrapper extends PostgresTransaction {
  client: PoolClient;
}

function getPoolClient(transaction: PostgresTransaction): PoolClient {
  return (transaction as TransactionWrapper).client;
}

export function createPostgresAdapter(poolConfig: PoolConfig): DatabaseAdapter {
  const pool = new Pool(poolConfig);
  const adapter: PostgresDatabaseAdapter = {
    disconnect: () => pool.end(),
    createTransaction: async () => {
      const client = await pool.connect();
      const transaction: TransactionWrapper = {
        _type: 'Transaction',
        client,
        release: () => client.release(),
      };
      return transaction;
    },
    query: async (transaction, query, values) => {
      const result = await (transaction
        ? getPoolClient(transaction).query(query, values)
        : pool.query(query, values));
      return result.rows;
    },
    isUniqueViolationOfConstraint,
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
