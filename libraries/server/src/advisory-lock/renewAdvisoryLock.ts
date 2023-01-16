import type { AdvisoryLockPayload, ErrorType, PromiseResult } from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import type { SessionContext } from '../Context.js';

export async function renewAdvisoryLock(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  name: string,
  handle: number
): PromiseResult<AdvisoryLockPayload, typeof ErrorType.NotFound | typeof ErrorType.Generic> {
  const { logger } = context;
  const result = await databaseAdapter.advisoryLockRenew(context, name, handle);
  if (result.isError()) return result;
  const { acquiredAt, renewedAt } = result.value;

  logger.info('Renewed advisory lock: %s', name);
  return ok({ name, handle, acquiredAt, renewedAt });
}
