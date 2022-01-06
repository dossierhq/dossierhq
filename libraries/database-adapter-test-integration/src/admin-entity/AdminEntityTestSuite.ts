import type { AdminClient } from '@jonasb/datadata-core';
import type { Server } from '@jonasb/datadata-server';
import type { TestFunctionInitializer, TestSuite } from '..';
import { buildSuite } from '../Builder';
import { ArchiveEntitySubSuite } from './AdminEntityArchiveEntitySubSuite';
import { CreateEntitySubSuite } from './AdminEntityCreateEntitySubSuite';
import { GetEntityHistorySubSuite } from './AdminEntityGetEntityHistorySubSuite';
import { GetEntitySubSuite } from './AdminEntityGetEntitySubSuite';
import { GetPublishingHistorySubSuite } from './AdminEntityGetPublishingHistorySubSuite';
import { PublishEntitiesSubSuite } from './AdminEntityPublishEntitiesSubSuite';
import { SearchEntitiesSubSuite } from './AdminEntitySearchEntitiesSubSuite';
import { UnarchiveEntitySubSuite } from './AdminEntityUnarchiveEntitySubSuite';
import { UnpublishEntitiesSubSuite } from './AdminEntityUnpublishEntitiesSubSuite';
import { UpdateEntitySubSuite } from './AdminEntityUpdateEntitySubSuite';
import { UpsertEntitySubSuite } from './AdminEntityUpsertEntitySubSuite';

export interface AdminEntityTestContext {
  server: Server;
  client: AdminClient;
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
    ...PublishEntitiesSubSuite,
    ...SearchEntitiesSubSuite,
    ...UnarchiveEntitySubSuite,
    ...UnpublishEntitiesSubSuite,
    ...UpdateEntitySubSuite,
    ...UpsertEntitySubSuite
  );
}
