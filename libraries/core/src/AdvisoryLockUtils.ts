import type { AdminClient } from './AdminClient.js';
import {
  ErrorType,
  createErrorResult,
  notOk,
  type ErrorResult,
  type PromiseResult,
} from './ErrorResult.js';
import { NoOpLogger } from './Logger.js';
import type { AdvisoryLockOptions, AdvisoryLockPayload } from './Types.js';

interface AdvisoryLockHelperOptions extends AdvisoryLockOptions {
  acquireInterval: number;
  renewInterval: number;
}

type AdvisoryLockHelperStatus =
  | { active: true; renewError: null }
  | {
      active: false;
      renewError: ErrorResult<unknown, typeof ErrorType.Generic>;
    };

export async function withAdvisoryLock<TOk, TError extends ErrorType>(
  adminClient: AdminClient,
  name: string,
  options: AdvisoryLockHelperOptions,
  callback: (status: AdvisoryLockHelperStatus) => PromiseResult<TOk, TError>
): PromiseResult<TOk, TError | typeof ErrorType.Generic> {
  // Acquire lock
  const { acquireInterval, renewInterval, ...acquireOptions } = options;
  const acquireResult = await acquireLockWithRetry(
    adminClient,
    name,
    acquireOptions,
    acquireInterval
  );
  if (acquireResult.isError()) return notOk.Generic(acquireResult.message); // BadRequest -> Generic
  const { handle } = acquireResult.value;

  const status: AdvisoryLockHelperStatus = { active: true, renewError: null };

  // Keep lock alive
  const intervalHandle = setInterval(() => {
    (async () => {
      try {
        const renewResult = await adminClient.renewAdvisoryLock(name, handle);
        if (renewResult.isError()) {
          setStatusError(status, notOk.Generic(renewResult.message)); // NotFound -> Generic
        }
      } catch (error) {
        setStatusError(status, notOk.GenericUnexpectedException({ logger: NoOpLogger }, error));
      }
      if (!status.active) {
        clearInterval(intervalHandle);
      }
    })();
  }, renewInterval);

  const result = await callback(status);

  const realRenewError: AdvisoryLockHelperStatus['renewError'] = status.renewError;

  clearInterval(intervalHandle);
  if (status.active) {
    setStatusError(status, notOk.Generic('Somehow accessed status after returning from callback'));
    await adminClient.releaseAdvisoryLock(name, handle); // ignore potential error of releasing
  }

  return realRenewError ? realRenewError : result;
}

function setStatusError(
  status: AdvisoryLockHelperStatus,
  renewError: AdvisoryLockHelperStatus['renewError']
) {
  status.active = false;
  status.renewError = renewError;
}

async function acquireLockWithRetry(
  adminClient: AdminClient,
  name: string,
  options: AdvisoryLockOptions,
  acquireInterval: number
): PromiseResult<AdvisoryLockPayload, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await adminClient.acquireAdvisoryLock(name, options);
    if (result.isOk()) return result.map((it) => it);

    const errorType = result.error;
    if (errorType === ErrorType.Conflict) {
      await new Promise((resolve) => setTimeout(resolve, acquireInterval));
      continue; // retry
    } else {
      return createErrorResult(errorType, result.message);
    }
  }
}
