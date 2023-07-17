import type { Server } from '@dossierhq/server';
import { buildSuite } from '../Builder.js';
import type { TestFunctionInitializer, TestSuite } from '../index.js';
import { SchemaGetSchemaSpecificationSubSuite } from './SchemaGetSchemaSpecificationSubSuite.js';
import { SchemaUpdateSchemaSpecificationSubSuite } from './SchemaUpdateSchemaSpecificationSubSuite.js';
import { ServerProcessNextDirtyEntitySubSuite } from './ServerProcessNextDirtyEntitySubSuite.js';

export interface SchemaTestContext {
  server: Server;
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
