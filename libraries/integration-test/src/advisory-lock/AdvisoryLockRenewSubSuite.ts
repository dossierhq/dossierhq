import { ErrorType } from '@dossierhq/core';
import { assertEquals, assertErrorResult, assertOkResult } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type { AdvisoryLockTestContext } from './AdvisoryLockTestSuite.js';

export const AdvisoryLockRenewSubSuite: UnboundTestFunction<AdvisoryLockTestContext>[] = [
  renewLock_minimal,
  renewLock_errorInvalidName,
  renewLock_errorInvalidHandle,
];

async function renewLock_minimal({ clientProvider }: AdvisoryLockTestContext) {
  const adminClient = clientProvider.adminClient();

  const acquireResult = await adminClient.acquireAdvisoryLock('renewLock_minimal', {
    leaseDuration: 500,
  });
  assertOkResult(acquireResult);

  const renewResult = await adminClient.renewAdvisoryLock(
    'renewLock_minimal',
    acquireResult.value.handle,
  );
  assertOkResult(renewResult);

  const { name } = renewResult.value;
  assertEquals(name, 'renewLock_minimal');
  assertEquals(acquireResult.value.handle, renewResult.value.handle);
}

async function renewLock_errorInvalidName({ clientProvider }: AdvisoryLockTestContext) {
  const adminClient = clientProvider.adminClient();

  const renewResult = await adminClient.renewAdvisoryLock('renewLock_errorInvalidName', 123);
  assertErrorResult(
    renewResult,
    ErrorType.NotFound,
    "Failed renewing lock, no advisory lock with the name 'renewLock_errorInvalidName' exists",
  );
}

async function renewLock_errorInvalidHandle({ clientProvider }: AdvisoryLockTestContext) {
  const adminClient = clientProvider.adminClient();

  const acquireResult = await adminClient.acquireAdvisoryLock('renewLock_errorInvalidHandle', {
    leaseDuration: 500,
  });
  assertOkResult(acquireResult);

  const renewResult = await adminClient.renewAdvisoryLock(
    'renewLock_errorInvalidHandle',
    acquireResult.value.handle + 1,
  );
  assertErrorResult(
    renewResult,
    ErrorType.NotFound,
    "Invalid handle used for renewing lock 'renewLock_errorInvalidHandle'",
  );
}
