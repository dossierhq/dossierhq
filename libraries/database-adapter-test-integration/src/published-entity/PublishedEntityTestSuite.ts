import type { AdminClient, PublishedClient } from '@jonasb/datadata-core';
import type { Server } from '@jonasb/datadata-server';
import type { TestFunctionInitializer, TestSuite } from '..';
import { buildSuite } from '../Builder';
import { GetEntitiesSubSuite } from './PublishedEntityGetEntitiesSubSuite';
import { GetEntitySubSuite } from './PublishedEntityGetEntitySubSuite';

export interface PublishedEntityTestContext {
  server: Server;
  adminClient: AdminClient;
  publishedClient: PublishedClient;
}

export function createPublishedEntityTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<PublishedEntityTestContext, TCleanup>
): TestSuite {
  return buildSuite(initializer, ...GetEntitySubSuite, ...GetEntitiesSubSuite);
}
