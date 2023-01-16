import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { NoOpLogger } from '@dossierhq/core';
import type { TestSuite } from '@dossierhq/database-adapter-test-integration';
import { test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import * as SqlJs from 'sql.js';
import type { SqlJsDatabaseAdapter } from '../src/SqlJsAdapter.js';
import { createSqlJsAdapter } from '../src/SqlJsAdapter.js';

export async function createSqlJsTestAdapter(): PromiseResult<
  SqlJsDatabaseAdapter,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const SQL = await SqlJs.default();
  const db = new SQL.Database();
  return await createSqlJsAdapter({ logger: NoOpLogger }, db, {
    migrate: true,
    fts: { version: 'fts4' },
    journalMode: 'memory',
  });
}

export function registerTestSuite(testSuite: TestSuite): void {
  polyfillCrypto();
  for (const [testName, testFunction] of Object.entries(testSuite)) {
    test(testName, testFunction);
  }
}

function polyfillCrypto() {
  // This package is meant to be run in a browser, polyfill crypto for Node
  if (!globalThis.crypto) {
    globalThis.crypto = {
      randomUUID,
    } as Crypto;
  }
}
