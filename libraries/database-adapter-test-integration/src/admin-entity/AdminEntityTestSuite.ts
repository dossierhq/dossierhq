import type { AdminClient } from '@jonasb/datadata-core';
import type { Server } from '@jonasb/datadata-server';
import type { TestFunctionInitializer, TestSuite } from '..';
import { buildSuite } from '../Builder';
import type { ReadOnlyEntityRepository } from '../shared-entity/ReadOnlyEntityRepository';
import { ArchiveEntitySubSuite } from './AdminEntityArchiveEntitySubSuite';
import { CreateEntitySubSuite } from './AdminEntityCreateEntitySubSuite';
import { GetEntityHistorySubSuite } from './AdminEntityGetEntityHistorySubSuite';
import { GetEntitySubSuite } from './AdminEntityGetEntitySubSuite';
import { GetPublishingHistorySubSuite } from './AdminEntityGetPublishingHistorySubSuite';
import { GetTotalCountSubSuite } from './AdminEntityGetTotalCountSubSuite';
import { PublishEntitiesSubSuite } from './AdminEntityPublishEntitiesSubSuite';
import { SearchEntitiesSubSuite } from './AdminEntitySearchEntitiesSubSuite';
import { UnarchiveEntitySubSuite } from './AdminEntityUnarchiveEntitySubSuite';
import { UnpublishEntitiesSubSuite } from './AdminEntityUnpublishEntitiesSubSuite';
import { UpdateEntitySubSuite } from './AdminEntityUpdateEntitySubSuite';
import { UpsertEntitySubSuite } from './AdminEntityUpsertEntitySubSuite';

export interface AdminEntityTestContext {
  server: Server;
  client: AdminClient;
  readOnlyEntityRepository: ReadOnlyEntityRepository;
}

export function createAdminEntityTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<AdminEntityTestContext, TCleanup>
): TestSuite {
  return buildSuite(
    initializer,
    ...ArchiveEntitySubSuite,
    ...CreateEntitySubSuite,
    ...GetEntityHistorySubSuite,
    ...GetEntitySubSuite,
    ...GetPublishingHistorySubSuite,
    ...GetTotalCountSubSuite,
    ...PublishEntitiesSubSuite,
    ...SearchEntitiesSubSuite,
    ...UnarchiveEntitySubSuite,
    ...UnpublishEntitiesSubSuite,
    ...UpdateEntitySubSuite,
    ...UpsertEntitySubSuite
  );
}
