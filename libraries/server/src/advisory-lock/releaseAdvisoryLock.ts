import type { AdvisoryLockReleasePayload, ErrorType, PromiseResult } from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import type { SessionContext } from '../Context.js';

export async function releaseAdvisoryLock(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  name: string,
  handle: number,
): PromiseResult<
  AdvisoryLockReleasePayload,
  typeof ErrorType.BadRequest | typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const { logger, session } = context;

  if (session.type === 'readonly') {
    return notOk.BadRequest('Readonly session used to release advisory lock');
  }

  const result = await databaseAdapter.advisoryLockRelease(context, name, handle);
  if (result.isError()) return result;

  logger.info('Released advisory lock: %s', name);
  return ok({ name });
}
