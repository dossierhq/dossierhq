import { buildSuite } from '../Builder.js';
import type {
  DossierClientProvider,
  PublishedDossierClientProvider,
  TestFunctionInitializer,
  TestSuite,
} from '../index.js';
import type { ReadOnlyEntityRepository } from '../shared-entity/ReadOnlyEntityRepository.js';
import { ArchiveEntitySubSuite } from './AdminEntityArchiveEntitySubSuite.js';
import { CreateEntitySubSuite } from './AdminEntityCreateEntitySubSuite.js';
import { DeleteEntitiesSubSuite } from './AdminEntityDeleteEntitiesSubSuite.js';
import { GetEntitiesSampleSubSuite } from './AdminEntityGetEntitiesSampleSubSuite.js';
import { GetEntitiesSubSuite } from './AdminEntityGetEntitiesSubSuite.js';
import { GetEntitiesTotalCountSubSuite } from './AdminEntityGetEntitiesTotalCountSubSuite.js';
import { GetEntityListSubSuite } from './AdminEntityGetEntityListSubSuite.js';
import { GetEntitySubSuite } from './AdminEntityGetEntitySubSuite.js';
import { ProcessDirtyEntitySubSuite } from './AdminEntityProcessDirtyEntitySubSuite.js';
import { PublishEntitiesSubSuite } from './AdminEntityPublishEntitiesSubSuite.js';
import { UnarchiveEntitySubSuite } from './AdminEntityUnarchiveEntitySubSuite.js';
import { UnpublishEntitiesSubSuite } from './AdminEntityUnpublishEntitiesSubSuite.js';
import { UpdateEntitySubSuite } from './AdminEntityUpdateEntitySubSuite.js';
import { UpsertEntitySubSuite } from './AdminEntityUpsertEntitySubSuite.js';

export interface AdminEntityTestContext {
  clientProvider: DossierClientProvider & PublishedDossierClientProvider;
  readOnlyEntityRepository: ReadOnlyEntityRepository;
}

export function createAdminEntityTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<AdminEntityTestContext, TCleanup>,
): TestSuite {
  return buildSuite(
    initializer,
    ...ArchiveEntitySubSuite,
    ...CreateEntitySubSuite,
    ...DeleteEntitiesSubSuite,
    ...GetEntitiesSampleSubSuite,
    ...GetEntitiesSubSuite,
    ...GetEntitiesTotalCountSubSuite,
    ...GetEntityListSubSuite,
    ...GetEntitySubSuite,
    ...ProcessDirtyEntitySubSuite,
    ...PublishEntitiesSubSuite,
    ...UnarchiveEntitySubSuite,
    ...UnpublishEntitiesSubSuite,
    ...UpdateEntitySubSuite,
    ...UpsertEntitySubSuite,
  );
}
