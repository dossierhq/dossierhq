import type {
  AdminEntityPublishPayload,
  AdminSchemaWithMigrations,
  EntityVersionReference,
  PromiseResult,
  PublishedSchema,
} from '@dossierhq/core';
import { ErrorType, notOk, ok } from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { adminPublishEntities } from './adminPublishEntities.js';

//TODO not optimized since we already have the entity data before this and adminPublishEntities() fetches it again

export async function publishEntityAfterMutation(
  adminSchema: AdminSchemaWithMigrations,
  publishedSchema: PublishedSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  reference: EntityVersionReference,
): PromiseResult<
  AdminEntityPublishPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  const publishResult = await adminPublishEntities(
    adminSchema,
    publishedSchema,
    authorizationAdapter,
    databaseAdapter,
    context,
    [reference],
    false,
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
