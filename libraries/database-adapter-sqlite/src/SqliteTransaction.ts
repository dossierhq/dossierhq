import type { ErrorType, Result } from '@jonasb/datadata-core';
import type { SqliteDatabaseAdapter } from './SqliteDatabaseAdapter';
import { queryNone } from './QueryFunctions';

export function withSynchronousTransaction<TOk, TError extends ErrorType>(
  databaseAdapter: SqliteDatabaseAdapter,
  callback: () => Result<TOk, TError>
): Result<TOk, TError | ErrorType.Generic> {
  const beginResult = queryNone(databaseAdapter, 'BEGIN');
  if (beginResult.isError()) {
    return beginResult;
  }
  const callbackResult = callback();
  if (callbackResult.isError()) {
    queryNone(databaseAdapter, 'ROLLBACK'); // ignore result
    return callbackResult;
  }
  const commitResult = queryNone(databaseAdapter, 'COMMIT');
  if (commitResult.isError()) {
    return commitResult;
  }
  return callbackResult;
}
