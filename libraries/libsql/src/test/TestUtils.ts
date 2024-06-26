import type { TestSuite } from '@dossierhq/integration-test';
import { describe, it } from 'vitest';

export function registerTestSuite(testSuiteName: string, testSuite: TestSuite): void {
  describe(testSuiteName, () => {
    for (const [testName, testFunction] of Object.entries(testSuite)) {
      it(testName, { timeout: testFunction.timeout === 'long' ? 20_000 : undefined }, testFunction);
    }
  });
}
