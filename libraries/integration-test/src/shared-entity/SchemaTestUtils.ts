import {
  ok,
  withAdvisoryLock,
  type EntityReference,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import type { ProcessDirtyEntityPayload, Server } from '@dossierhq/server';
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

export async function processDirtyEntity(
  server: Server,
  reference: EntityReference,
): PromiseResult<ProcessDirtyEntityPayload[], typeof ErrorType.Generic> {
  const payload: ProcessDirtyEntityPayload[] = [];
  const result = await processAllDirtyEntities(server, reference, (processed) => {
    payload.push(processed);
  });
  if (result.isError()) return result;
  return ok(payload);
}

export async function processAllDirtyEntities(
  server: Server,
  filter: Parameters<Server['processNextDirtyEntity']>[0],
  onProcessed?: (processed: ProcessDirtyEntityPayload) => void,
): PromiseResult<void, typeof ErrorType.Generic> {
  let done = false;
  while (!done) {
    const processResult = await server.processNextDirtyEntity(filter);
    if (processResult.isError()) return processResult;
    if (processResult.value) {
      onProcessed?.(processResult.value);
    } else {
      done = true;
    }
  }
  return ok(undefined);
}
