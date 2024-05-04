import { randomUUID } from 'node:crypto';
import { NoOpLogger, type ErrorType, type PromiseResult } from '@dossierhq/core';
import type { TestSuite } from '@dossierhq/integration-test';
import { createSqlJsAdapter, type SqlJsDatabaseAdapter } from '@dossierhq/sql.js';
import { test } from '@playwright/test';
import * as SqlJs from 'sql.js';

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
  polyfillCrypto();
  test.describe(testSuiteName, () => {
    for (const [testName, testFunction] of Object.entries(testSuite)) {
      test(testName, testFunction);
    }
  });
}

function polyfillCrypto() {
  // This package is meant to be run in a browser, polyfill crypto for Node
  if (!globalThis.crypto) {
    globalThis.crypto = {
      randomUUID,
    } as Crypto;
  }
}

export function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new Error(
      `Expected 'val' to be defined, but received ${val === undefined ? 'undefined' : 'null'}`,
    );
  }
}
