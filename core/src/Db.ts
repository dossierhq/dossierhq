import type {
  QueryArrayConfig,
  QueryArrayResult,
  QueryConfig,
  QueryResult,
  QueryResultRow,
} from 'pg';
import { Pool as PgPool } from 'pg';

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

export async function withRootTransaction<T>(
  pool: Pool,
  callback: (queryable: Queryable) => Promise<T>
): Promise<T> {
  const client = await (pool as PoolWrapper).wrapped.connect();
  const clientWrapper: QueryableWrapper = { _type: 'Queryable', wrapped: client };
  try {
    await client.query('BEGIN');
    const result = await callback(clientWrapper);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function withNestedTransaction<T>(
  queryable: Queryable,
  callback: () => Promise<T>
): Promise<T> {
  const q = (queryable as QueryableWrapper).wrapped;
  try {
    await q.query('BEGIN');
    const result = await callback();
    await q.query('COMMIT');
    return result;
  } catch (e) {
    await q.query('ROLLBACK');
    throw e;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function query<R extends QueryResultRow = any, I extends any[] = any[]>(
  queryable: Queryable,
  queryTextOrConfig: string | QueryConfig<I>,
  values?: I
): Promise<QueryResult<R>> {
  return (queryable as QueryableWrapper).wrapped.query(queryTextOrConfig, values);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function queryArray<R extends any[] = any[], I extends any[] = any[]>(
  queryable: Queryable,
  queryConfig: QueryArrayConfig<I>,
  values?: I
): Promise<QueryArrayResult<R>> {
  return (queryable as QueryableWrapper).wrapped.query(queryConfig, values);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function queryNone<I extends any[] = any[]>(
  queryable: Queryable,
  queryTextOrConfig: string | QueryConfig<I>,
  values?: I
): Promise<void> {
  const { rows } = await (queryable as QueryableWrapper).wrapped.query(queryTextOrConfig, values);
  if (rows.length === 0) {
    return;
  }
  throw new Error(`Expected 0 rows, got ${rows.length}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function queryNoneOrOne<R extends QueryResultRow = any, I extends any[] = any[]>(
  queryable: Queryable,
  queryTextOrConfig: string | QueryConfig<I>,
  values?: I
): Promise<R | null> {
  const { rows } = await (queryable as QueryableWrapper).wrapped.query(queryTextOrConfig, values);
  if (rows.length === 0) {
    return null;
  }
  if (rows.length !== 1) {
    throw new Error(`Expected 0 or 1 row, got ${rows.length}`);
  }
  return rows[0];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function queryOne<R extends QueryResultRow = any, I extends any[] = any[]>(
  queryable: Queryable,
  queryTextOrConfig: string | QueryConfig<I>,
  values?: I
): Promise<R> {
  const { rows } = await (queryable as QueryableWrapper).wrapped.query(queryTextOrConfig, values);
  if (rows.length !== 1) {
    throw new Error(`Expected 1 row, got ${rows.length}`);
  }
  return rows[0];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function queryMany<R extends QueryResultRow = any, I extends any[] = any[]>(
  queryable: Queryable,
  queryTextOrConfig: string | QueryConfig<I>,
  values?: I
): Promise<R[]> {
  const { rows } = await (queryable as QueryableWrapper).wrapped.query(queryTextOrConfig, values);
  return rows;
}
