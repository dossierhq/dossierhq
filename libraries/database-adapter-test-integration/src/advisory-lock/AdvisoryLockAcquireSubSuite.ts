import { ErrorType } from '@dossierhq/core';
import { assertEquals, assertErrorResult, assertOkResult } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import { adminClientForMainPrincipal } from '../shared-entity/TestClients.js';
import type { AdvisoryLockTestContext } from './AdvisoryLockTestSuite.js';

export const AdvisoryLockAcquireSubSuite: UnboundTestFunction<AdvisoryLockTestContext>[] = [
  acquireLock_minimal,
  acquireLock_errorConflictIfAlreadyAcquired,
];

async function acquireLock_minimal({ server }: AdvisoryLockTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const result = await adminClient.acquireAdvisoryLock('acquireLock_minimal', { leaseDuration: 1 });
  assertOkResult(result);
  const { name, handle } = result.value;
  assertEquals(name, 'acquireLock_minimal');
  assertEquals(typeof handle, 'number');
}

async function acquireLock_errorConflictIfAlreadyAcquired({ server }: AdvisoryLockTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const firstResult = await adminClient.acquireAdvisoryLock(
    'acquireLock_errorConflictIfAlreadyAcquired',
    { leaseDuration: 500 }
  );
  assertOkResult(firstResult);

  const secondResult = await adminClient.acquireAdvisoryLock(
    'acquireLock_errorConflictIfAlreadyAcquired',
    { leaseDuration: 500 }
  );
  assertErrorResult(
    secondResult,
    ErrorType.Conflict,
    "Lock with name 'acquireLock_errorConflictIfAlreadyAcquired' already exists"
  );
}
