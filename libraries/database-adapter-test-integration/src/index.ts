export { createAuthTestSuite } from './auth/AuthTestSuite';
export { createSchemaTestSuite } from './schema/SchemaTestSuite';
export { createTestAuthorizationAdapter } from './TestAuthorizationAdapter';

export interface TestFunctionInitializer<TContext, TCleanup> {
  before: () => Promise<[TContext, TCleanup]>;
  after: (cleanup: TCleanup) => Promise<void>;
}

export type TestFunction = () => void | Promise<void>;

export interface TestSuite {
  [testName: string]: TestFunction;
}
