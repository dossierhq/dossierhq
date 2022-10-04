import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { NoOpLogger } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type { TestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import * as base64 from 'base-64';
import { randomUUID } from 'node:crypto';
import * as SqlJs from 'sql.js';
import { test } from 'vitest';
import { createSqlJsAdapter } from '../SqlJsAdapter.js';

export async function createSqlJsTestAdapter(): PromiseResult<
  DatabaseAdapter,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const SQL = await SqlJs.default();
  const db = new SQL.Database();
  return await createSqlJsAdapter({ logger: NoOpLogger }, db);
}

export function registerTestSuite(testSuite: TestSuite): void {
  polyfillCrypto();
  polyfillAtoBToA();
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

function polyfillAtoBToA() {
  // This package is meant to be run in a browser, polyfill aotb/btoa for Node
  if (!globalThis.atob) {
    globalThis.atob = base64.decode;
  }
  if (!globalThis.btoa) {
    globalThis.btoa = base64.encode;
  }
}
