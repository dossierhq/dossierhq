import { ok, withAdvisoryLock, type ErrorType, type PromiseResult } from '@dossierhq/core';
import type { Server } from '@dossierhq/server';
import type { AppAdminClient } from '../SchemaTypes.js';

export async function withSchemaAdvisoryLock<TOk, TError extends ErrorType>(
  adminClient: AppAdminClient,
  callback: () => PromiseResult<TOk, TError>,
): PromiseResult<TOk, TError | typeof ErrorType.Generic> {
  return await withAdvisoryLock(
    adminClient,
    'schema-update',
    { acquireInterval: 50, leaseDuration: 300, renewInterval: 200 },
    callback,
  );
}

export async function processAllDirtyEntities(
  server: Server,
  onProcessed?: (processed: { id: string; valid: boolean; validPublished: boolean | null }) => void,
): PromiseResult<void, typeof ErrorType.Generic> {
  let done = false;
  while (!done) {
    const processResult = await server.processNextDirtyEntity();
    if (processResult.isError()) return processResult;
    if (processResult.value) {
      onProcessed?.(processResult.value);
    } else {
      done = true;
    }
  }
  return ok(undefined);
}
