import type {
  EntityReference,
  ErrorType,
  PromiseResult,
  PublishedEntity,
  SchemaWithMigrations,
  UniqueIndexReference,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import { authVerifyAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { decodePublishedEntity } from '../EntityCodec.js';
import { validateEntityReference } from '../utils/ValidationUtils.js';

export async function publishedGetEntity(
  schema: SchemaWithMigrations,
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
  const validationResult = validateEntityReference(reference);
  if (validationResult.isError()) return validationResult;

  const result = await databaseAdapter.publishedEntityGetOne(context, reference);
  if (result.isError()) return result;

  const { authKey, resolvedAuthKey } = result.value;

  const authResult = await authVerifyAuthorizationKey(authorizationAdapter, context, {
    authKey,
    resolvedAuthKey,
  });
  if (authResult.isError()) return authResult;

  return decodePublishedEntity(schema, result.value);
}
