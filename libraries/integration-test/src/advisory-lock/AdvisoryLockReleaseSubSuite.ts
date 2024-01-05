import { ErrorType } from '@dossierhq/core';
import { assertErrorResult, assertOkResult, assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type { AdvisoryLockTestContext } from './AdvisoryLockTestSuite.js';

export const AdvisoryLockReleaseSubSuite: UnboundTestFunction<AdvisoryLockTestContext>[] = [
  releaseLock_minimal,
  releaseLock_errorInvalidName,
  releaseLock_errorInvalidHandle,
];

async function releaseLock_minimal({ clientProvider }: AdvisoryLockTestContext) {
  const adminClient = clientProvider.adminClient();

  const acquireResult = await adminClient.acquireAdvisoryLock('releaseLock_minimal', {
    leaseDuration: 1_000,
  });
  assertOkResult(acquireResult);
  const { name, handle } = acquireResult.value;

  const releaseResult = await adminClient.releaseAdvisoryLock(name, handle);
  assertResultValue(releaseResult, { name });

  const acquireAgainResult = await adminClient.acquireAdvisoryLock('releaseLock_minimal', {
    leaseDuration: 1,
  });
  assertOkResult(acquireAgainResult);
}

async function releaseLock_errorInvalidName({ clientProvider }: AdvisoryLockTestContext) {
  const adminClient = clientProvider.adminClient();

  const releaseResult = await adminClient.releaseAdvisoryLock('releaseLock_errorInvalidName', 123);
  assertErrorResult(releaseResult, ErrorType.NotFound, 'No such name or handle exists');
}

async function releaseLock_errorInvalidHandle({ clientProvider }: AdvisoryLockTestContext) {
  const adminClient = clientProvider.adminClient();

  const acquireResult = await adminClient.acquireAdvisoryLock('releaseLock_errorInvalidHandle', {
    leaseDuration: 500,
  });
  assertOkResult(acquireResult);

  const releaseResult = await adminClient.releaseAdvisoryLock(
    'releaseLock_errorInvalidHandle',
    acquireResult.value.handle + 1,
  );
  assertErrorResult(releaseResult, ErrorType.NotFound, 'No such name or handle exists');
}
