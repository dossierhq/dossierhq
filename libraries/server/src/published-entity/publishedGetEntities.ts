import type {
  EntityReferenceWithAuthKeys,
  ErrorType,
  PromiseResult,
  PublishedEntity,
  PublishedSchema,
  Result,
} from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type {
  AuthorizationAdapter,
  DatabaseAdapter,
  DatabasePublishedEntityGetOnePayload,
  SessionContext,
} from '..';
import { authVerifyAuthorizationKey } from '../Auth';
import { decodePublishedEntity } from '../EntityCodec';

/**
 * Fetches published entities. The entities are returned in the same order as in `ids`.
 *
 * If any of the entities are missing that item is returned as an error but the others are returned
 * as normal.
 * @param context The session context
 * @param ids The ids of the entities
 */

export async function publishedGetEntities(
  schema: PublishedSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  references: EntityReferenceWithAuthKeys[]
): PromiseResult<
  Result<
    PublishedEntity,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
  >[],
  ErrorType.Generic
> {
  if (references.length === 0) {
    return ok([]);
  }
  const entitiesInfoResult = await databaseAdapter.publishedEntityGetEntities(context, references);
  if (entitiesInfoResult.isError()) {
    return entitiesInfoResult;
  }

  const result: Result<
    PublishedEntity,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
  >[] = [];
  for (const reference of references) {
    const entityMain = entitiesInfoResult.value.find((it) => it.id === reference.id);
    result.push(await mapItem(schema, authorizationAdapter, context, reference, entityMain));
  }

  return ok(result);
}

async function mapItem(
  schema: PublishedSchema,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  reference: EntityReferenceWithAuthKeys,
  values: DatabasePublishedEntityGetOnePayload | undefined
): PromiseResult<
  PublishedEntity,
  ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
> {
  if (!values) {
    return notOk.NotFound('No such entity');
  }

  const authResult = await authVerifyAuthorizationKey(
    authorizationAdapter,
    context,
    reference.authKeys,
    { authKey: values.authKey, resolvedAuthKey: values.resolvedAuthKey }
  );
  if (authResult.isError()) {
    return authResult;
  }

  const entity = decodePublishedEntity(schema, values);
  return ok(entity);
}
