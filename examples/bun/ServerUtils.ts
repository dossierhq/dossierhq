import type { Context } from '@jonasb/datadata-database-adapter';
import { Database } from 'bun:sqlite';
import { createBunSqliteAdapter } from './bun-adapter/BunSqliteAdapter.js';

export function createAdapter(context: Context, filename: string) {
  const database = Database.open(filename);
  return createBunSqliteAdapter(context, database);
}
