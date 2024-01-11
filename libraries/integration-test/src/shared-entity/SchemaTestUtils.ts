import { withAdvisoryLock, type ErrorType, type PromiseResult } from '@dossierhq/core';
import type { AppAdminClient } from '../SchemaTypes.js';

export async function withSchemaAdvisoryLock<TOk, TError extends ErrorType>(
  adminClient: AppAdminClient,
  callback: () => PromiseResult<TOk, TError>,
): PromiseResult<TOk, TError | typeof ErrorType.Generic> {
  return await withAdvisoryLock(
    adminClient,
    'schema-update',
    { acquireInterval: 50, leaseDuration: 500, renewInterval: 200 },
    callback,
  );
}
