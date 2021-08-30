import { TestSuite } from "@jonasb/datadata-database-adapter-test";

export function registerTestSuite(testSuite: TestSuite) {
  for (const [testName, testFunction] of Object.entries(testSuite)) {
    Deno.test({ name: testName, fn: testFunction });
  }
}
