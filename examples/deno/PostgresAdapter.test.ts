import { AllTests, TestSuite } from "@jonasb/datadata-database-adapter-test";

function registerTestSuite(testSuite: TestSuite) {
  for (const [testName, testFunction] of Object.entries(testSuite)) {
    Deno.test(testName, testFunction);
  }
}

registerTestSuite(AllTests);
