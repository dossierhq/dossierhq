export { createAuthTestSuite } from './auth/AuthTestSuite';

export interface TestFunctionInitializer<TContext, TCleanup> {
  before: () => [TContext, TCleanup];
  after: (cleanup: TCleanup) => Promise<void>;
}

export type TestFunction = () => void | Promise<void>;

export interface TestSuite {
  [testName: string]: TestFunction;
}
