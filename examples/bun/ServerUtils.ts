import type { Context } from '@dossierhq/bun-sqlite';
import { createBunSqliteAdapter } from '@dossierhq/bun-sqlite';
import { Database } from 'bun:sqlite';

export function createAdapter(context: Context, filename: string) {
  const database = Database.open(filename);
  return createBunSqliteAdapter(context, database, {
    migrate: true,
    fts: { version: 'fts5' },
    journalMode: 'wal',
  });
}
