import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { NoOpLogger } from '@dossierhq/core';
import type { TestSuite } from '@dossierhq/integration-test';
import * as base64 from 'base-64';
import * as SqlJs from 'sql.js';
import { describe, test } from 'vitest';
import type { SqlJsDatabaseAdapter } from '../SqlJsAdapter.js';
import { createSqlJsAdapter } from '../SqlJsAdapter.js';

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

export function registerTestSuite(testSuiteName: string, testSuite: TestSuite): void {
  polyfillAtoBToA();
  describe(testSuiteName, () => {
    for (const [testName, testFunction] of Object.entries(testSuite)) {
      test(testName, testFunction);
    }
  });
}

function polyfillAtoBToA() {
  // This package is meant to be run in a browser, polyfill aotb/btoa for Node
  if (!globalThis.atob) {
    globalThis.atob = base64.decode;
  }
  if (!globalThis.btoa) {
    globalThis.btoa = base64.encode;
  }
}
