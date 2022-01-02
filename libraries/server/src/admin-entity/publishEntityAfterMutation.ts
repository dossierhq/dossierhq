import type {
  AdminEntityPublishPayload,
  AdminSchema,
  EntityVersionReferenceWithAuthKeys,
  PromiseResult,
} from '@jonasb/datadata-core';
import { ErrorType, notOk, ok } from '@jonasb/datadata-core';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '..';
import { adminPublishEntities } from './adminPublishEntities';

//TODO not optimized since we already have the entity data before this and adminPublishEntities() fetches it again

export async function publishEntityAfterMutation(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  reference: EntityVersionReferenceWithAuthKeys
): PromiseResult<
  AdminEntityPublishPayload,
  ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const publishResult = await adminPublishEntities(
    schema,
    authorizationAdapter,
    databaseAdapter,
    context,
    [reference]
  );
  if (publishResult.isError()) {
    if (
      publishResult.isErrorType(ErrorType.BadRequest) ||
      publishResult.isErrorType(ErrorType.NotAuthorized) ||
      publishResult.isErrorType(ErrorType.Generic)
    ) {
      return publishResult;
    }
    // NotFound
    return notOk.GenericUnexpectedError(publishResult);
  }
  return ok(publishResult.value[0]);
}
