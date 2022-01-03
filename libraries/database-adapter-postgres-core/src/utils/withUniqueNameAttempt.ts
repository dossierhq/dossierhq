import {
  ErrorType,
  notOk,
  type ErrorResult,
  type OkResult,
  type PromiseResult,
} from '@jonasb/datadata-core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import type { PostgresDatabaseAdapter } from '..';
import { queryNone } from '../QueryFunctions';

const nameConflictErrorMessage = 'Name is not unique';
const maxAttempts = 10;

export async function withUniqueNameAttempt<TOk, TError extends ErrorType>(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  name: string,
  randomNameGenerator: (name: string) => string,
  attempt: (
    context: TransactionContext,
    name: string,
    nameConflictErrorMessage: string
  ) => PromiseResult<TOk, TError | ErrorType.Conflict>
): PromiseResult<TOk, TError | ErrorType.Generic> {
  let potentiallyModifiedName = name;
  let first = true;
  for (let i = 0; i < maxAttempts; i += 1) {
    const createSavePointResult = await queryNone(
      databaseAdapter,
      context,
      first ? 'SAVEPOINT unique_name' : 'ROLLBACK TO SAVEPOINT unique_name; SAVEPOINT unique_name'
    );
    if (createSavePointResult.isError()) {
      return createSavePointResult;
    }
    first = false;

    const attemptResult = await attempt(context, potentiallyModifiedName, nameConflictErrorMessage);
    if (attemptResult.isError()) {
      if (
        attemptResult.isErrorType(ErrorType.Conflict) &&
        attemptResult.message === nameConflictErrorMessage
      ) {
        potentiallyModifiedName = randomNameGenerator(name);
        continue;
      } else {
        return attemptResult as ErrorResult<TOk, TError>;
      }
    }

    const releaseSavePointResult = await queryNone(
      databaseAdapter,
      context,
      'RELEASE SAVEPOINT unique_name'
    );
    if (releaseSavePointResult.isError()) {
      return releaseSavePointResult;
    }

    return attemptResult as OkResult<TOk, TError>;
  }
  return notOk.Generic(`Failed creating a unique name for ${name}`);
}
