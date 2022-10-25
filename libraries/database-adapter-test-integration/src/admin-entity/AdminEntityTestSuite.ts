import type { AdminSchema } from '@jonasb/datadata-core';
import type { Server } from '@jonasb/datadata-server';
import { buildSuite } from '../Builder.js';
import type { TestFunctionInitializer, TestSuite } from '../index.js';
import type { ReadOnlyEntityRepository } from '../shared-entity/ReadOnlyEntityRepository.js';
import { ArchiveEntitySubSuite } from './AdminEntityArchiveEntitySubSuite.js';
import { CreateEntitySubSuite } from './AdminEntityCreateEntitySubSuite.js';
import { GetEntitiesSubSuite } from './AdminEntityGetEntitiesSubSuite.js';
import { GetEntityHistorySubSuite } from './AdminEntityGetEntityHistorySubSuite.js';
import { GetEntitySubSuite } from './AdminEntityGetEntitySubSuite.js';
import { GetPublishingHistorySubSuite } from './AdminEntityGetPublishingHistorySubSuite.js';
import { GetTotalCountSubSuite } from './AdminEntityGetTotalCountSubSuite.js';
import { PublishEntitiesSubSuite } from './AdminEntityPublishEntitiesSubSuite.js';
import { SampleEntitiesSubSuite } from './AdminEntitySampleEntitiesSubSuite.js';
import { SearchEntitiesSubSuite } from './AdminEntitySearchEntitiesSubSuite.js';
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
  initializer: TestFunctionInitializer<AdminEntityTestContext, TCleanup>
): TestSuite {
  return buildSuite(
    initializer,
    ...ArchiveEntitySubSuite,
    ...CreateEntitySubSuite,
    ...GetEntitiesSubSuite,
    ...GetEntityHistorySubSuite,
    ...GetEntitySubSuite,
    ...GetPublishingHistorySubSuite,
    ...GetTotalCountSubSuite,
    ...PublishEntitiesSubSuite,
    ...SampleEntitiesSubSuite,
    ...SearchEntitiesSubSuite,
    ...UnarchiveEntitySubSuite,
    ...UnpublishEntitiesSubSuite,
    ...UpdateEntitySubSuite,
    ...UpsertEntitySubSuite
  );
}
