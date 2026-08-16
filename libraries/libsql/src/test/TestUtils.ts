import type { TestSuite } from '@dossierhq/integration-test';
import { describe, it } from 'vitest';

export function registerTestSuite(testSuiteName: string, testSuite: TestSuite): void {
  describe(testSuiteName, () => {
    for (const [testName, testFunction] of Object.entries(testSuite)) {
      // 'long' tests set up their own servers (SyncTest starts two sqld processes), so the
      // timeout has to leave room for SqldRunner's health check to expire and report its log.
      it(testName, { timeout: testFunction.timeout === 'long' ? 60_000 : 20_000 }, testFunction);
    }
  });
}
