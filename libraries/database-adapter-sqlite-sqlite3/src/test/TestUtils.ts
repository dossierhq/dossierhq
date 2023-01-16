import type { TestSuite } from '@dossierhq/database-adapter-test-integration';
import { describe, it } from 'vitest';

export function registerTestSuite(testSuiteName: string, testSuite: TestSuite): void {
  describe(testSuiteName, () => {
    for (const [testName, testFunction] of Object.entries(testSuite)) {
      it(testName, testFunction);
    }
  });
}
