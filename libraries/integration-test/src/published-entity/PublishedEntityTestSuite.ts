import { buildSuite } from '../Builder.js';
import type {
  DossierClientProvider,
  PublishedDossierClientProvider,
  TestFunctionInitializer,
  TestSuite,
} from '../index.js';
import type { ReadOnlyEntityRepository } from '../shared-entity/ReadOnlyEntityRepository.js';
import { GetEntitiesSampleSubSuite } from './PublishedEntityGetEntitiesSampleSubSuite.js';
import { GetEntitiesSubSuite } from './PublishedEntityGetEntitiesSubSuite.js';
import { GetEntitiesTotalCountSubSuite } from './PublishedEntityGetEntitiesTotalCountSubSuite.js';
import { GetEntityListSubSuite } from './PublishedEntityGetEntityListSubSuite.js';
import { GetEntitySubSuite } from './PublishedEntityGetEntitySubSuite.js';

export interface PublishedEntityTestContext {
  clientProvider: DossierClientProvider & PublishedDossierClientProvider;
  readOnlyEntityRepository: ReadOnlyEntityRepository;
}

export function createPublishedEntityTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<PublishedEntityTestContext, TCleanup>,
): TestSuite {
  return buildSuite(
    initializer,
    ...GetEntitySubSuite,
    ...GetEntityListSubSuite,
    ...GetEntitiesTotalCountSubSuite,
    ...GetEntitiesSampleSubSuite,
    ...GetEntitiesSubSuite,
  );
}
