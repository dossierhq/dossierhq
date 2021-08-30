import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type { PostgresDatabaseAdapter } from '@jonasb/datadata-database-adapter-postgres-core';
import { createPostgresDatabaseAdapterAdapter } from '@jonasb/datadata-database-adapter-postgres-core';
import type { DatabaseAdapter, Transaction } from '@jonasb/datadata-server';
import { Temporal } from '@js-temporal/polyfill';
import { DatabaseError, Pool, PoolClient, types as PgTypes } from 'pg';

PgTypes.setTypeParser(PgTypes.builtins.INT8, BigInt);
// 1016 = _int8 (int8 array)
PgTypes.setTypeParser(1016, (value) => PgTypes.arrayParser(value, BigInt));
PgTypes.setTypeParser(PgTypes.builtins.TIMESTAMPTZ, (value) => {
  if (value === '-infinity') return Number.NEGATIVE_INFINITY;
  if (value === 'infinity') return Number.POSITIVE_INFINITY;
  return Temporal.Instant.from(value);
});

interface TransactionWrapper extends Transaction {
  wrapped: PoolClient;
}

function getPoolClient(transaction: Transaction): PoolClient {
  return (transaction as TransactionWrapper).wrapped;
}

export function createPostgresAdapter(databaseUrl: string): DatabaseAdapter {
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter: PostgresDatabaseAdapter = {
    disconnect: () => pool.end(),
    withRootTransaction: (callback) => withRootTransaction(pool, callback),
    withNestedTransaction,
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

async function withRootTransaction<TOk, TError extends ErrorType>(
  pool: Pool,
  callback: (transaction: Transaction) => PromiseResult<TOk, TError>
): PromiseResult<TOk, TError> {
  const client = await pool.connect();
  const clientWrapper: TransactionWrapper = { _type: 'Transaction', wrapped: client };
  try {
    await client.query('BEGIN');
    const result = await callback(clientWrapper);
    if (result.isOk()) {
      await client.query('COMMIT');
    } else {
      await client.query('ROLLBACK');
    }
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function withNestedTransaction<TOk, TError extends ErrorType>(
  transaction: Transaction,
  callback: () => PromiseResult<TOk, TError>
): PromiseResult<TOk, TError> {
  const client = getPoolClient(transaction);
  try {
    await client.query('BEGIN');
    const result = await callback();
    if (result.isOk()) {
      await client.query('COMMIT');
    } else {
      await client.query('ROLLBACK');
    }
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
}

function isUniqueViolationOfConstraint(error: unknown, constraintName: string): boolean {
  const unique_violation = '23505';
  return (
    error instanceof DatabaseError &&
    error.code === unique_violation &&
    error.constraint === constraintName
  );
}
