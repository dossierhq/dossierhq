import type {
  AdvisoryLockOptions,
  AdvisoryLockPayload,
  ErrorType,
  PromiseResult,
} from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import type { SessionContext } from '../Context.js';

const MAX_HANDLE = 2147483647;

export async function acquireAdvisoryLock(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  name: string,
  options: AdvisoryLockOptions,
): PromiseResult<
  AdvisoryLockPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.Conflict | typeof ErrorType.Generic
> {
  const { logger, session } = context;

  if (session.type === 'readonly') {
    return notOk.BadRequest('Readonly session used to acquire advisory lock');
  }

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
    options.leaseDuration,
  );
  if (acquireResult.isError()) return acquireResult;
  const { acquiredAt } = acquireResult.value;

  return ok({ acquiredAt, renewedAt: acquiredAt, name, handle });
}
