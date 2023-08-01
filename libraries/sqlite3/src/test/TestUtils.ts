import type { TestSuite } from '@dossierhq/integration-test';
import { describe, test } from 'vitest';

export function registerTestSuite(testSuiteName: string, testSuite: TestSuite): void {
  describe(testSuiteName, () => {
    for (const [testName, testFunction] of Object.entries(testSuite)) {
      const timeout = testFunction.timeout ? { long: 20_000 }[testFunction.timeout] : undefined;
      test(testName, testFunction, { timeout });
    }
  });
}
