import { Pool, QueryResult, QueryResultRow } from 'pg';

export interface Queryable {
  query<R extends QueryResultRow = any, I extends any[] = any[]>(
    query: string,
    values?: I
  ): Promise<QueryResult<R>>;
}

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
});

// Only used for scripts
export function shutDownAsync() {
  return pool.end();
}

export function queryAsync<
  R extends QueryResultRow = any,
  I extends any[] = any[]
>(client: Queryable, query: string, values?: I) {
  return client.query<R>(query, values);
}

export async function queryOne(
  client: Queryable,
  queryTextOrConfig: any,
  values?: any
): Promise<any> {
  const { rows } = await client.query(queryTextOrConfig, values);
  if (rows.length !== 1) {
    throw new Error(`Expected 1 row, got ${rows.length}`);
  }
  return rows[0];
}

export async function queryNoneOrOne<
  R extends any = any,
  I extends any[] = any[]
>(client: Queryable, text: string, values?: I): Promise<R | null> {
  const { rows } = await client.query(text, values);
  if (rows.length === 0) {
    return null;
  }
  if (rows.length !== 1) {
    throw new Error(`Expected 0 or 1 row, got ${rows.length}`);
  }
  return rows[0];
}

export async function queryNone<I extends any[] = any[]>(
  client: Queryable,
  text: string,
  values?: I
): Promise<void> {
  const { rows } = await client.query(text, values);
  if (rows.length === 0) {
    return;
  }
  throw new Error(`Expected 0 rows, got ${rows.length}`);
}

export async function queryMany(
  client: Queryable,
  queryConfig: any,
  values?: any
): Promise<any> {
  const { rows } = await client.query(queryConfig, values);
  return rows;
}

export async function withTransaction<T>(
  callback: (client: Queryable) => Promise<T>
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
