import {
  notOk,
  ok,
  type AdvisoryLockPayload,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import type { SessionContext } from '../Context.js';

export async function renewAdvisoryLock(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  name: string,
  handle: number,
): PromiseResult<
  AdvisoryLockPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const { logger, session } = context;

  if (session.type === 'readonly') {
    return notOk.BadRequest('Readonly session used to renew advisory lock');
  }

  const result = await databaseAdapter.advisoryLockRenew(context, name, handle);
  if (result.isError()) return result;
  const { acquiredAt, renewedAt } = result.value;

  logger.info('Renewed advisory lock: %s', name);
  return ok({ name, handle, acquiredAt, renewedAt });
}
