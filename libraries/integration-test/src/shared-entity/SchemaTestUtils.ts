import { withAdvisoryLock, type ErrorType, type PromiseResult } from '@dossierhq/core';
import type { AppDossierClient } from '../SchemaTypes.js';

export async function withSchemaAdvisoryLock<TOk, TError extends ErrorType>(
  client: AppDossierClient,
  callback: () => PromiseResult<TOk, TError>,
): PromiseResult<TOk, TError | typeof ErrorType.Generic> {
  return await withAdvisoryLock(
    client,
    'schema-update',
    { acquireInterval: 300, leaseDuration: 2_000, renewInterval: 1_000 },
    callback,
  );
}
