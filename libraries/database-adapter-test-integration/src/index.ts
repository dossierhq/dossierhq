export { createAdminEntityTestSuite } from './admin-entity/AdminEntityTestSuite';
export { createAuthTestSuite } from './auth/AuthTestSuite';
export { IntegrationTestSchemaSpecifciationUpdate } from './IntegrationTestSchemaSpecifciationUpdate';
export { createPublishedEntityTestSuite } from './published-entity/PublishedEntityTestSuite';
export { createSchemaTestSuite } from './schema/SchemaTestSuite';
export {
  createReadOnlyEntityRepository,
  type ReadOnlyEntityRepository,
} from './shared-entity/ReadOnlyEntityRepository';
export { createTestAuthorizationAdapter } from './TestAuthorizationAdapter';

export interface TestFunctionInitializer<TContext, TCleanup> {
  before: () => Promise<[TContext, TCleanup]>;
  after: (cleanup: TCleanup) => Promise<void>;
}

export type TestFunction = () => void | Promise<void>;

export interface TestSuite {
  [testName: string]: TestFunction;
}
