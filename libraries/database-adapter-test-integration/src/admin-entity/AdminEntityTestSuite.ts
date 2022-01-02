import type { AdminClient } from '@jonasb/datadata-core';
import type { TestFunctionInitializer, TestSuite } from '..';
import { buildSuite } from '../Builder';
import { ArchiveEntitySubSuite } from './AdminEntityArchiveEntitySubSuite';
import { CreateEntitySubSuite } from './AdminEntityCreateEntitySubSuite';
import { GetEntitySubSuite } from './AdminEntityGetEntitySubSuite';
import { PublishEntitiesSubSuite } from './AdminEntityPublishEntitiesSubSuite';
import { UnarchiveEntitySubSuite } from './AdminEntityUnarchiveEntitySubSuite';
import { UnpublishEntitiesSubSuite } from './AdminEntityUnpublishEntitiesSubSuite';
import { UpdateEntitySubSuite } from './AdminEntityUpdateEntitySubSuite';
import { UpsertEntitySubSuite } from './AdminEntityUpsertEntitySubSuite';

export interface AdminEntityTestContext {
  client: AdminClient;
}

export function createAdminEntityTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<AdminEntityTestContext, TCleanup>
): TestSuite {
  return buildSuite(
    initializer,
    ...ArchiveEntitySubSuite,
    ...CreateEntitySubSuite,
    ...GetEntitySubSuite,
    ...PublishEntitiesSubSuite,
    ...UnarchiveEntitySubSuite,
    ...UnpublishEntitiesSubSuite,
    ...UpdateEntitySubSuite,
    ...UpsertEntitySubSuite
  );
}
