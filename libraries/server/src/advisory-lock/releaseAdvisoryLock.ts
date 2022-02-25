import type { AdvisoryLockReleasePayload, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type { SessionContext } from '..';

export async function releaseAdvisoryLock(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  name: string,
  handle: number
): PromiseResult<AdvisoryLockReleasePayload, ErrorType.NotFound | ErrorType.Generic> {
  const { logger } = context;
  const result = await databaseAdapter.advisoryLockRelease(context, name, handle);
  if (result.isError()) return result;

  logger.info('Released advisory lock: %s', name);
  return ok({ name });
}
