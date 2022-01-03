import type {
  EntityReferenceWithAuthKeys,
  ErrorType,
  PromiseResult,
  PublishedEntity,
  PublishedSchema,
} from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type { AuthorizationAdapter, SessionContext } from '..';
import { authVerifyAuthorizationKey } from '../Auth';
import { decodePublishedEntity } from '../EntityCodec';

export async function publishedGetEntity(
  schema: PublishedSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  reference: EntityReferenceWithAuthKeys
): PromiseResult<
  PublishedEntity,
  ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const result = await databaseAdapter.publishedEntityGetOne(context, reference);
  if (result.isError()) {
    return result;
  }
  const { authKey, resolvedAuthKey } = result.value;

  const authResult = await authVerifyAuthorizationKey(
    authorizationAdapter,
    context,
    reference?.authKeys,
    { authKey, resolvedAuthKey }
  );
  if (authResult.isError()) {
    return authResult;
  }

  const entity = decodePublishedEntity(schema, result.value);

  return ok(entity);
}
