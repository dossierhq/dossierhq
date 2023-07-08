import type { Server } from '@dossierhq/server';
import { buildSuite } from '../Builder.js';
import type { TestFunctionInitializer, TestSuite } from '../index.js';
import { AdvisoryLockAcquireSubSuite } from './AdvisoryLockAcquireSubSuite.js';
import { AdvisoryLockReleaseSubSuite } from './AdvisoryLockReleaseSubSuite.js';
import { AdvisoryLockRenewSubSuite } from './AdvisoryLockRenewSubSuite.js';

export interface AdvisoryLockTestContext {
  server: Server;
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
