import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type { PostgresDatabaseAdapter } from '@jonasb/datadata-database-adapter-postgres-core';
import { createPostgresDatabaseAdapterAdapter } from '@jonasb/datadata-database-adapter-postgres-core';
import type { DatabaseAdapter, Queryable } from '@jonasb/datadata-server';
import { Temporal } from '@js-temporal/polyfill';
import { DatabaseError, Pool, types as PgTypes } from 'pg';

PgTypes.setTypeParser(PgTypes.builtins.INT8, BigInt);
// 1016 = _int8 (int8 array)
PgTypes.setTypeParser(1016, (value) => PgTypes.arrayParser(value, BigInt));
PgTypes.setTypeParser(PgTypes.builtins.TIMESTAMPTZ, (value) => {
  if (value === '-infinity') return Number.NEGATIVE_INFINITY;
  if (value === 'infinity') return Number.POSITIVE_INFINITY;
  return Temporal.Instant.from(value);
});

type PgQueryable = Pick<Pool, 'query'>;

interface QueryableWrapper extends Queryable {
  wrapped: PgQueryable;
}

function getPgQueryable(queryable: Queryable): PgQueryable {
  return (queryable as QueryableWrapper).wrapped;
}

export function createPostgresAdapter(databaseUrl: string): DatabaseAdapter {
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter: PostgresDatabaseAdapter = {
    disconnect: () => pool.end(),
    withRootTransaction: (callback) => withRootTransaction(pool, callback),
    withNestedTransaction,
    query: async (transactionQueryable, query, values) => {
      const result = await (transactionQueryable
        ? getPgQueryable(transactionQueryable).query(query, values)
        : pool.query(query, values));
      return result.rows;
    },
    isUniqueViolationOfConstraint,
  };
  return createPostgresDatabaseAdapterAdapter(adapter);
}

async function withRootTransaction<TOk, TError extends ErrorType>(
  pool: Pool,
  callback: (queryable: Queryable) => PromiseResult<TOk, TError>
): PromiseResult<TOk, TError> {
  const client = await pool.connect();
  const clientWrapper: QueryableWrapper = { _type: 'Queryable', wrapped: client };
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
  queryable: Queryable,
  callback: () => PromiseResult<TOk, TError>
): PromiseResult<TOk, TError> {
  const pgQueryable = getPgQueryable(queryable);
  try {
    await pgQueryable.query('BEGIN');
    const result = await callback();
    if (result.isOk()) {
      await pgQueryable.query('COMMIT');
    } else {
      await pgQueryable.query('ROLLBACK');
    }
    return result;
  } catch (e) {
    await pgQueryable.query('ROLLBACK');
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
