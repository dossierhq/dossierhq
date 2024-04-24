import {
  ErrorType,
  createErrorResult,
  notOk,
  type ErrorResult,
  type PromiseResult,
} from '../ErrorResult.js';
import { NoOpLogger } from '../Logger.js';
import type { AdvisoryLockOptions, AdvisoryLockPayload, Component, Entity } from '../Types.js';
import type { AdminClient } from './DossierClient.js';

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
  adminClient: AdminClient<Entity<string, object>, Component<string, object>>,
  name: string,
  options: AdvisoryLockHelperOptions,
  callback: (status: AdvisoryLockHelperStatus) => PromiseResult<TOk, TError>,
): PromiseResult<TOk, TError | typeof ErrorType.Generic> {
  // Acquire lock
  const { acquireInterval, renewInterval, ...acquireOptions } = options;
  const acquireResult = await acquireLockWithRetry(
    adminClient,
    name,
    acquireOptions,
    acquireInterval,
  );
  if (acquireResult.isError()) return notOk.Generic(acquireResult.message); // BadRequest -> Generic
  const { handle } = acquireResult.value;

  const status: AdvisoryLockHelperStatus = { active: true, renewError: null };

  // Keep lock alive
  const intervalHandle = setInterval(() => {
    void (async () => {
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

  let result;
  try {
    result = await callback(status);
  } catch (error) {
    result = notOk.GenericUnexpectedException({ logger: NoOpLogger }, error);
  }

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
  renewError: AdvisoryLockHelperStatus['renewError'],
) {
  status.active = false;
  status.renewError = renewError;
}

async function acquireLockWithRetry(
  adminClient: AdminClient<Entity<string, object>, Component<string, object>>,
  name: string,
  options: AdvisoryLockOptions,
  acquireInterval: number,
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
