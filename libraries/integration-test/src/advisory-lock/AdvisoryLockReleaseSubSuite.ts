import { ErrorType } from '@dossierhq/core';
import { assertErrorResult, assertOkResult, assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type { AdvisoryLockTestContext } from './AdvisoryLockTestSuite.js';

export const AdvisoryLockReleaseSubSuite: UnboundTestFunction<AdvisoryLockTestContext>[] = [
  releaseLock_minimal,
  releaseLock_errorInvalidName,
  releaseLock_errorInvalidHandle,
  releaseLock_errorReadonlySession,
];

async function releaseLock_minimal({ clientProvider }: AdvisoryLockTestContext) {
  const client = clientProvider.dossierClient();

  const acquireResult = await client.acquireAdvisoryLock('releaseLock_minimal', {
    leaseDuration: 1_000,
  });
  assertOkResult(acquireResult);
  const { name, handle } = acquireResult.value;

  const releaseResult = await client.releaseAdvisoryLock(name, handle);
  assertResultValue(releaseResult, { name });

  const acquireAgainResult = await client.acquireAdvisoryLock('releaseLock_minimal', {
    leaseDuration: 1,
  });
  assertOkResult(acquireAgainResult);
}

async function releaseLock_errorInvalidName({ clientProvider }: AdvisoryLockTestContext) {
  const client = clientProvider.dossierClient();

  const releaseResult = await client.releaseAdvisoryLock('releaseLock_errorInvalidName', 123);
  assertErrorResult(
    releaseResult,
    ErrorType.NotFound,
    "Failed releasing lock, no advisory lock with the name 'releaseLock_errorInvalidName' exists",
  );
}

async function releaseLock_errorInvalidHandle({ clientProvider }: AdvisoryLockTestContext) {
  const client = clientProvider.dossierClient();

  const acquireResult = await client.acquireAdvisoryLock('releaseLock_errorInvalidHandle', {
    leaseDuration: 500,
  });
  assertOkResult(acquireResult);

  const releaseResult = await client.releaseAdvisoryLock(
    'releaseLock_errorInvalidHandle',
    acquireResult.value.handle + 1,
  );
  assertErrorResult(
    releaseResult,
    ErrorType.NotFound,
    "Invalid handle used for releasing lock 'releaseLock_errorInvalidHandle'",
  );
}

async function releaseLock_errorReadonlySession({ clientProvider }: AdvisoryLockTestContext) {
  const client = clientProvider.dossierClient('main', 'readonly');
  const result = await client.releaseAdvisoryLock('releaseLock_errorReadonlySession', 123);
  assertErrorResult(result, ErrorType.BadRequest, 'Readonly session used to release advisory lock');
}
