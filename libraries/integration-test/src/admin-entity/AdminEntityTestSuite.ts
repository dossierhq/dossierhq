import type { AdminSchema } from '@dossierhq/core';
import type { Server } from '@dossierhq/server';
import { buildSuite } from '../Builder.js';
import type { TestFunctionInitializer, TestSuite } from '../index.js';
import type { ReadOnlyEntityRepository } from '../shared-entity/ReadOnlyEntityRepository.js';
import { ArchiveEntitySubSuite } from './AdminEntityArchiveEntitySubSuite.js';
import { CreateEntitySubSuite } from './AdminEntityCreateEntitySubSuite.js';
import { GetEntitiesSampleSubSuite } from './AdminEntityGetEntitiesSampleSubSuite.js';
import { GetEntitiesSubSuite } from './AdminEntityGetEntitiesSubSuite.js';
import { GetEntitiesTotalCountSubSuite } from './AdminEntityGetEntitiesTotalCountSubSuite.js';
import { GetEntityHistorySubSuite } from './AdminEntityGetEntityHistorySubSuite.js';
import { GetEntityListSubSuite } from './AdminEntityGetEntityListSubSuite.js';
import { GetEntitySubSuite } from './AdminEntityGetEntitySubSuite.js';
import { GetPublishingHistorySubSuite } from './AdminEntityGetPublishingHistorySubSuite.js';
import { PublishEntitiesSubSuite } from './AdminEntityPublishEntitiesSubSuite.js';
import { UnarchiveEntitySubSuite } from './AdminEntityUnarchiveEntitySubSuite.js';
import { UnpublishEntitiesSubSuite } from './AdminEntityUnpublishEntitiesSubSuite.js';
import { UpdateEntitySubSuite } from './AdminEntityUpdateEntitySubSuite.js';
import { UpsertEntitySubSuite } from './AdminEntityUpsertEntitySubSuite.js';

export interface AdminEntityTestContext {
  server: Server;
  adminSchema: AdminSchema;
  readOnlyEntityRepository: ReadOnlyEntityRepository;
}

export function createAdminEntityTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<AdminEntityTestContext, TCleanup>,
): TestSuite {
  return buildSuite(
    initializer,
    ...ArchiveEntitySubSuite,
    ...CreateEntitySubSuite,
    ...GetEntityHistorySubSuite,
    ...GetEntityListSubSuite,
    ...GetEntitySubSuite,
    ...GetPublishingHistorySubSuite,
    ...GetEntitiesTotalCountSubSuite,
    ...PublishEntitiesSubSuite,
    ...GetEntitiesSampleSubSuite,
    ...GetEntitiesSubSuite,
    ...UnarchiveEntitySubSuite,
    ...UnpublishEntitiesSubSuite,
    ...UpdateEntitySubSuite,
    ...UpsertEntitySubSuite,
  );
}
