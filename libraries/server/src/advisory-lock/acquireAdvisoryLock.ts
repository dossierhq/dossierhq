import type {
  AdvisoryLockOptions,
  AdvisoryLockPayload,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type { SessionContext } from '..';

const MAX_HANDLE = 2147483647;

export async function acquireAdvisoryLock(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  name: string,
  options: AdvisoryLockOptions
): PromiseResult<
  AdvisoryLockPayload,
  ErrorType.BadRequest | ErrorType.Conflict | ErrorType.Generic
> {
  const { logger } = context;

  if (!name) {
    return notOk.BadRequest('No name provided');
  }

  const deleteResult = await databaseAdapter.advisoryLockDeleteExpired(context);
  if (deleteResult.isError()) return deleteResult;
  const deletedLocks = deleteResult.value;

  if (deletedLocks.length > 0) {
    logger.info('Remove %d expired advisory locks: %s', [
      deletedLocks.length,
      deletedLocks.join(', '),
    ]);
  }

  const handle = Math.floor(Math.random() * MAX_HANDLE);

  const acquireResult = await databaseAdapter.advisoryLockAcquire(
    context,
    name,
    handle,
    options.leaseDuration
  );
  if (acquireResult.isError()) return acquireResult;
  const { acquiredAt } = acquireResult.value;

  return ok({ acquiredAt, renewedAt: acquiredAt, name, handle });
}
