import { buildSuite } from '../Builder.js';
import type {
  AdminClientProvider,
  PublishedClientProvider,
  TestFunctionInitializer,
  TestSuite,
} from '../index.js';
import { SchemaGetSchemaSpecificationSubSuite } from './SchemaGetSchemaSpecificationSubSuite.js';
import { SchemaUpdateSchemaSpecificationSubSuite } from './SchemaUpdateSchemaSpecificationSubSuite.js';
import { ServerProcessNextDirtyEntitySubSuite } from './ServerProcessNextDirtyEntitySubSuite.js';

export interface SchemaTestContext {
  clientProvider: AdminClientProvider & PublishedClientProvider;
}

export function createSchemaTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<SchemaTestContext, TCleanup>,
): TestSuite {
  return buildSuite(
    initializer,
    ...SchemaGetSchemaSpecificationSubSuite,
    ...SchemaUpdateSchemaSpecificationSubSuite,
    ...ServerProcessNextDirtyEntitySubSuite,
  );
}
