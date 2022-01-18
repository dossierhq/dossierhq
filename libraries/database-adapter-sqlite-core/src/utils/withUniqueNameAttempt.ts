import { ErrorType, notOk, type ErrorResult, type PromiseResult } from '@jonasb/datadata-core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';

const nameConflictErrorMessage = 'Name is not unique';
const maxAttempts = 10;

export async function withUniqueNameAttempt<TOk, TError extends ErrorType>(
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
  for (let i = 0; i < maxAttempts; i += 1) {
    const attemptResult = await context.withTransaction(async (context) => {
      return await attempt(context, potentiallyModifiedName, nameConflictErrorMessage);
    });
    if (attemptResult.isOk()) {
      return attemptResult.map((it) => it);
    }
    if (
      attemptResult.isErrorType(ErrorType.Conflict) &&
      attemptResult.message === nameConflictErrorMessage
    ) {
      potentiallyModifiedName = randomNameGenerator(name);
    } else {
      return attemptResult as ErrorResult<TOk, TError>;
    }
  }
  return notOk.Generic(`Failed creating a unique name for ${name}`);
}
