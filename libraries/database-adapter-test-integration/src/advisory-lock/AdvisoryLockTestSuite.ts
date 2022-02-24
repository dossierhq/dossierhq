import type { Server } from '@jonasb/datadata-server';
import type { TestFunctionInitializer, TestSuite } from '..';
import { buildSuite } from '../Builder';
import { AdvisoryLockAcquireSubSuite } from './AdvisoryLockAcquireSubSuite';
import { AdvisoryLockReleaseSubSuite } from './AdvisoryLockReleaseSubSuite';
import { AdvisoryLockRenewSubSuite } from './AdvisoryLockRenewSubSuite';

export interface AdvisoryLockTestContext {
  server: Server;
}

export function createAdvisoryLockTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<AdvisoryLockTestContext, TCleanup>
): TestSuite {
  return buildSuite(
    initializer,
    ...AdvisoryLockAcquireSubSuite,
    ...AdvisoryLockReleaseSubSuite,
    ...AdvisoryLockRenewSubSuite
  );
}
