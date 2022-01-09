import type { AdminClient, PublishedClient } from '@jonasb/datadata-core';
import type { Server } from '@jonasb/datadata-server';
import type { TestFunctionInitializer, TestSuite } from '..';
import { buildSuite } from '../Builder';
import type { ReadOnlyEntityRepository } from '../shared-entity/ReadOnlyEntityRepository';
import { GetEntitiesSubSuite } from './PublishedEntityGetEntitiesSubSuite';
import { GetEntitySubSuite } from './PublishedEntityGetEntitySubSuite';
import { GetTotalCountSubSuite } from './PublishedEntityGetTotalCountSubSuite';
import { SearchEntitiesSubSuite } from './PublishedEntitySearchEntitiesSubSuite';

export interface PublishedEntityTestContext {
  server: Server;
  adminClient: AdminClient;
  publishedClient: PublishedClient;
  readOnlyEntityRepository: ReadOnlyEntityRepository;
}

export function createPublishedEntityTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<PublishedEntityTestContext, TCleanup>
): TestSuite {
  return buildSuite(
    initializer,
    ...GetEntitySubSuite,
    ...GetEntitiesSubSuite,
    ...GetTotalCountSubSuite,
    ...SearchEntitiesSubSuite
  );
}
