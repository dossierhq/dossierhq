import { createBunSqliteAdapter } from '@dossierhq/bun-sqlite';
import type { LoggerContext } from '@dossierhq/core';
import { Database } from 'bun:sqlite';

export function createAdapter(context: LoggerContext, filename: string) {
  const database = new Database(filename, { strict: true });
  return createBunSqliteAdapter(context, database, {
    migrate: true,
    fts: { version: 'fts5' },
    journalMode: 'wal',
  });
}
