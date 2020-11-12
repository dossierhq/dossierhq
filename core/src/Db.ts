import type {
  QueryArrayConfig,
  QueryArrayResult,
  QueryConfig,
  QueryResult,
  QueryResultRow,
} from 'pg';
import { Pool as PgPool } from 'pg';
import type { Context, ErrorType, PromiseResult } from '.';

export class UnexpectedQuantityError extends Error {
  constructor(message: string, readonly actual: number) {
    super(message);
    this.name = 'UnexpectedQuantityError';
  }
}

type PgQueryable = Pick<PgPool, 'query'>;

export interface Queryable {
  _type: 'Queryable' | 'Pool';
}

export interface Pool extends Queryable {
  _type: 'Pool';
}

interface QueryableWrapper extends Queryable {
  wrapped: PgQueryable;
}

interface PoolWrapper extends Pool {
  wrapped: PgPool;
}

function getQueryable(context: Context<unknown>): PgQueryable {
  return (context.queryable as QueryableWrapper).wrapped;
}

function getPool(context: Context<unknown>): PgPool {
  return (context.pool as PoolWrapper).wrapped;
}

export function connect(databaseUrl: string): Pool {
  const wrapper: PoolWrapper = {
    _type: 'Pool',
    wrapped: new PgPool({
      connectionString: databaseUrl,
    }),
  };
  return wrapper;
}

export function disconnect(pool: Pool): Promise<void> {
  return (pool as PoolWrapper).wrapped.end();
}

export async function withRootTransaction<TOk, TError extends ErrorType>(
  context: Context<unknown>,
  callback: (queryable: Queryable) => PromiseResult<TOk, TError>
): PromiseResult<TOk, TError> {
  const client = await getPool(context).connect();
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

export async function withNestedTransaction<TOk, TError extends ErrorType>(
  context: Context<unknown>,
  callback: () => PromiseResult<TOk, TError>
): PromiseResult<TOk, TError> {
  const queryable = getQueryable(context);
  try {
    await queryable.query('BEGIN');
    const result = await callback();
    if (result.isOk()) {
      await queryable.query('COMMIT');
    } else {
      await queryable.query('ROLLBACK');
    }
    return result;
  } catch (e) {
    await queryable.query('ROLLBACK');
    throw e;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function query<R extends QueryResultRow = any, I extends any[] = any[]>(
  context: Context<unknown>,
  queryTextOrConfig: string | QueryConfig<I>,
  values?: I
): Promise<QueryResult<R>> {
  return getQueryable(context).query(queryTextOrConfig, values);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function queryArray<R extends any[] = any[], I extends any[] = any[]>(
  context: Context<unknown>,
  queryConfig: QueryArrayConfig<I>,
  values?: I
): Promise<QueryArrayResult<R>> {
  return getQueryable(context).query(queryConfig, values);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function queryNone<I extends any[] = any[]>(
  context: Context<unknown>,
  queryTextOrConfig: string | QueryConfig<I>,
  values?: I
): Promise<void> {
  const { rows } = await getQueryable(context).query(queryTextOrConfig, values);
  if (rows.length === 0) {
    return;
  }
  throw new UnexpectedQuantityError(`Expected 0 rows, got ${rows.length}`, rows.length);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function queryNoneOrOne<R extends QueryResultRow = any, I extends any[] = any[]>(
  context: Context<unknown>,
  queryTextOrConfig: string | QueryConfig<I>,
  values?: I
): Promise<R | null> {
  const { rows } = await getQueryable(context).query(queryTextOrConfig, values);
  if (rows.length === 0) {
    return null;
  }
  if (rows.length !== 1) {
    throw new UnexpectedQuantityError(`Expected 0 or 1 row, got ${rows.length}`, rows.length);
  }
  return rows[0];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function queryOne<R extends QueryResultRow = any, I extends any[] = any[]>(
  context: Context<unknown>,
  queryTextOrConfig: string | QueryConfig<I>,
  values?: I
): Promise<R> {
  const { rows } = await getQueryable(context).query(queryTextOrConfig, values);
  if (rows.length !== 1) {
    throw new UnexpectedQuantityError(`Expected 1 row, got ${rows.length}`, rows.length);
  }
  return rows[0];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function queryMany<R extends QueryResultRow = any, I extends any[] = any[]>(
  context: Context<unknown>,
  queryTextOrConfig: string | QueryConfig<I>,
  values?: I
): Promise<R[]> {
  const { rows } = await getQueryable(context).query(queryTextOrConfig, values);
  return rows;
}
