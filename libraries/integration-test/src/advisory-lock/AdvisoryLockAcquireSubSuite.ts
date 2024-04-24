import { ErrorType } from '@dossierhq/core';
import { assertEquals, assertErrorResult, assertOkResult } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type { AdvisoryLockTestContext } from './AdvisoryLockTestSuite.js';

export const AdvisoryLockAcquireSubSuite: UnboundTestFunction<AdvisoryLockTestContext>[] = [
  acquireLock_minimal,
  acquireLock_errorConflictIfAlreadyAcquired,
  acquireLock_errorReadonlySession,
];

async function acquireLock_minimal({ clientProvider }: AdvisoryLockTestContext) {
  const client = clientProvider.dossierClient();
  const result = await client.acquireAdvisoryLock('acquireLock_minimal', { leaseDuration: 1 });
  assertOkResult(result);
  const { name, handle } = result.value;
  assertEquals(name, 'acquireLock_minimal');
  assertEquals(typeof handle, 'number');
}

async function acquireLock_errorConflictIfAlreadyAcquired({
  clientProvider,
}: AdvisoryLockTestContext) {
  const client = clientProvider.dossierClient();
  const firstResult = await client.acquireAdvisoryLock(
    'acquireLock_errorConflictIfAlreadyAcquired',
    { leaseDuration: 500 },
  );
  assertOkResult(firstResult);

  const secondResult = await client.acquireAdvisoryLock(
    'acquireLock_errorConflictIfAlreadyAcquired',
    { leaseDuration: 500 },
  );
  assertErrorResult(
    secondResult,
    ErrorType.Conflict,
    "Lock with name 'acquireLock_errorConflictIfAlreadyAcquired' already exists",
  );
}

async function acquireLock_errorReadonlySession({ clientProvider }: AdvisoryLockTestContext) {
  const client = clientProvider.dossierClient('main', 'readonly');
  const result = await client.acquireAdvisoryLock('acquireLock_errorReadonlySession', {
    leaseDuration: 1,
  });
  assertErrorResult(result, ErrorType.BadRequest, 'Readonly session used to acquire advisory lock');
}
