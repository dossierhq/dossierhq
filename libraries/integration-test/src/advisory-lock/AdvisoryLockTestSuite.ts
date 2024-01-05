import { buildSuite } from '../Builder.js';
import type { AdminClientProvider, TestFunctionInitializer, TestSuite } from '../index.js';
import { AdvisoryLockAcquireSubSuite } from './AdvisoryLockAcquireSubSuite.js';
import { AdvisoryLockReleaseSubSuite } from './AdvisoryLockReleaseSubSuite.js';
import { AdvisoryLockRenewSubSuite } from './AdvisoryLockRenewSubSuite.js';

export interface AdvisoryLockTestContext {
  clientProvider: AdminClientProvider;
}

export function createAdvisoryLockTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<AdvisoryLockTestContext, TCleanup>,
): TestSuite {
  return buildSuite(
    initializer,
    ...AdvisoryLockAcquireSubSuite,
    ...AdvisoryLockReleaseSubSuite,
    ...AdvisoryLockRenewSubSuite,
  );
}
