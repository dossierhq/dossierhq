import type { TestSuite } from '@jonasb/datadata-database-adapter-test-integration';

export function registerTestSuite(testSuite: TestSuite): void {
  for (const [testName, testFunction] of Object.entries(testSuite)) {
    test(testName, testFunction as jest.ProvidesCallback);
  }
}
