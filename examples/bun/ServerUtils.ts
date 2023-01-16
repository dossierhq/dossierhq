import type { Context } from '@dossierhq/database-adapter-sqlite-bun';
import { createBunSqliteAdapter } from '@dossierhq/database-adapter-sqlite-bun';
import { Database } from 'bun:sqlite';

export function createAdapter(context: Context, filename: string) {
  const database = Database.open(filename);
  return createBunSqliteAdapter(context, database, {
    migrate: true,
    fts: { version: 'fts5' },
    journalMode: 'wal',
  });
}
