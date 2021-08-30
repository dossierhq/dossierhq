import type { TestSuite } from "@jonasb/datadata-database-adapter-test-integration";

export function registerTestSuite(testSuite: TestSuite) {
  for (const [testName, testFunction] of Object.entries(testSuite)) {
    Deno.test({ name: testName, fn: testFunction });
  }
}
