import { createBunSqliteAdapter, type BunSqliteDatabaseAdapter } from '@dossierhq/bun-sqlite';
import type { LoggerContext, PromiseResult } from '@dossierhq/core';
import { Database } from 'bun:sqlite';

export function createAdapter(
  context: LoggerContext,
  filename: string,
): PromiseResult<BunSqliteDatabaseAdapter, 'BadRequest' | 'Generic'> {
  const database = new Database(filename, { strict: true });
  return createBunSqliteAdapter(context, database, {
    migrate: true,
    fts: { version: 'fts5' },
    journalMode: 'wal',
  });
}
