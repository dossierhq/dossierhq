import type { AdminClient, PublishedClient } from '@jonasb/datadata-core';
import type { TestFunctionInitializer, TestSuite } from '..';
import { buildSuite } from '../Builder';
import { GetEntitySubSuite } from './PublishedEntityGetEntitySubSuite';

export interface PublishedEntityTestContext {
  adminClient: AdminClient;
  publishedClient: PublishedClient;
}

export function createPublishedEntityTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<PublishedEntityTestContext, TCleanup>
): TestSuite {
  return buildSuite(initializer, ...GetEntitySubSuite);
}
