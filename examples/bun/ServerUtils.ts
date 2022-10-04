import type { Context } from '@jonasb/datadata-database-adapter';
import { createBunSqliteAdapter } from '@jonasb/datadata-database-adapter-sqlite-bun';
import { Database } from 'bun:sqlite';

export function createAdapter(context: Context, filename: string) {
  const database = Database.open(filename);
  return createBunSqliteAdapter(context, database);
}
