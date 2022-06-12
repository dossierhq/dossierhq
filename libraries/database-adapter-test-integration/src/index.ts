export { createAdminEntityTestSuite } from './admin-entity/AdminEntityTestSuite.js';
export { createAdvisoryLockTestSuite } from './advisory-lock/AdvisoryLockTestSuite.js';
export { createAuthTestSuite } from './auth/AuthTestSuite.js';
export { IntegrationTestSchema } from './IntegrationTestSchema.js';
export { createPublishedEntityTestSuite } from './published-entity/PublishedEntityTestSuite.js';
export { createSchemaTestSuite } from './schema/SchemaTestSuite.js';
export {
  createReadOnlyEntityRepository,
  type ReadOnlyEntityRepository,
} from './shared-entity/ReadOnlyEntityRepository.js';
export { createTestAuthorizationAdapter } from './TestAuthorizationAdapter.js';

export interface TestFunctionInitializer<TContext, TCleanup> {
  before: () => Promise<[TContext, TCleanup]>;
  after: (cleanup: TCleanup) => Promise<void>;
}

export type TestFunction = () => void | Promise<void>;

export interface TestSuite {
  [testName: string]: TestFunction;
}
