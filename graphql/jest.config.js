module.exports = {
  displayName: 'graphql',
  preset: 'ts-jest',
  testEnvironment: 'node',
  globalSetup: './test/setup.ts',
  globalTeardown: './test/teardown.ts',
};
