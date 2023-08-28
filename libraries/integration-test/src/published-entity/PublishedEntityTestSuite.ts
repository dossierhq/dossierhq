import type { AdminSchema } from '@dossierhq/core';
import type { Server } from '@dossierhq/server';
import { buildSuite } from '../Builder.js';
import type { TestFunctionInitializer, TestSuite } from '../index.js';
import type { ReadOnlyEntityRepository } from '../shared-entity/ReadOnlyEntityRepository.js';
import { GetEntityListSubSuite } from './PublishedEntityGetEntityListSubSuite.js';
import { GetEntitySubSuite } from './PublishedEntityGetEntitySubSuite.js';
import { GetTotalCountSubSuite } from './PublishedEntityGetTotalCountSubSuite.js';
import { SampleEntitiesSubSuite } from './PublishedEntitySampleEntitiesSubSuite.js';
import { SearchEntitiesSubSuite } from './PublishedEntitySearchEntitiesSubSuite.js';

export interface PublishedEntityTestContext {
  server: Server;
  adminSchema: AdminSchema;
  readOnlyEntityRepository: ReadOnlyEntityRepository;
}

export function createPublishedEntityTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<PublishedEntityTestContext, TCleanup>,
): TestSuite {
  return buildSuite(
    initializer,
    ...GetEntitySubSuite,
    ...GetEntityListSubSuite,
    ...GetTotalCountSubSuite,
    ...SampleEntitiesSubSuite,
    ...SearchEntitiesSubSuite,
  );
}
