import type {
  AdminSchemaWithMigrations,
  EntityReference,
  ErrorType,
  PromiseResult,
  PublishedEntity,
  UniqueIndexReference,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import { authVerifyAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { decodePublishedEntity } from '../EntityCodec.js';

export async function publishedGetEntity(
  adminSchema: AdminSchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  reference: EntityReference | UniqueIndexReference,
): PromiseResult<
  PublishedEntity,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotFound
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  const result = await databaseAdapter.publishedEntityGetOne(context, reference);
  if (result.isError()) return result;

  const { authKey, resolvedAuthKey } = result.value;

  const authResult = await authVerifyAuthorizationKey(authorizationAdapter, context, {
    authKey,
    resolvedAuthKey,
  });
  if (authResult.isError()) return authResult;

  return decodePublishedEntity(adminSchema, result.value);
}
