import type {
  EntityReference,
  ErrorType,
  PromiseResult,
  PublishedEntity,
  PublishedSchema,
  UniqueIndexReference,
} from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import { authVerifyAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { decodePublishedEntity } from '../EntityCodec.js';

export async function publishedGetEntity(
  schema: PublishedSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  reference: EntityReference | UniqueIndexReference
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

  const entity = decodePublishedEntity(schema, result.value);

  return ok(entity);
}
