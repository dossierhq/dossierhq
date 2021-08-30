import { AllTests, TestSuite } from '@jonasb/datadata-database-adapter-test';

function registerTestSuite(testSuite: TestSuite) {
  for (const [testName, testFunction] of Object.entries(testSuite)) {
    test(testName, testFunction as jest.ProvidesCallback);
  }
}

registerTestSuite(AllTests);
