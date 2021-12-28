import type { AdminClient } from '@jonasb/datadata-core';
import type { TestFunctionInitializer, TestSuite } from '..';
import { buildSuite } from '../Builder';
import { CreateEntitySubSuite } from './AdminEntityCreateEntitySubSuite';

export interface AdminEntityTestContext {
  client: AdminClient;
}

export function createAdminEntityTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<AdminEntityTestContext, TCleanup>
): TestSuite {
  return buildSuite(initializer, ...CreateEntitySubSuite);
}
