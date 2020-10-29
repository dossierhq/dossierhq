import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}

export async function shutDown(): Promise<void> {
  if (!pool) {
    return;
  }
  await pool.end();
  pool = null;
}
