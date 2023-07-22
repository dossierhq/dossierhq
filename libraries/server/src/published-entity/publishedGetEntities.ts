import type {
  AdminSchemaWithMigrations,
  EntityReference,
  ErrorType,
  PromiseResult,
  PublishedEntity,
  Result,
} from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabasePublishedEntityGetOnePayload,
} from '@dossierhq/database-adapter';
import { authVerifyAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { decodePublishedEntity } from '../EntityCodec.js';

/**
 * Fetches published entities. The entities are returned in the same order as in `ids`.
 *
 * If any of the entities are missing that item is returned as an error but the others are returned
 * as normal.
 * @param context The session context
 * @param ids The ids of the entities
 */

export async function publishedGetEntities(
  adminSchema: AdminSchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  references: EntityReference[],
): PromiseResult<
  Result<
    PublishedEntity,
    | typeof ErrorType.BadRequest
    | typeof ErrorType.NotFound
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  >[],
  typeof ErrorType.Generic
> {
  if (references.length === 0) {
    return ok([]);
  }
  const entitiesInfoResult = await databaseAdapter.publishedEntityGetEntities(context, references);
  if (entitiesInfoResult.isError()) return entitiesInfoResult;

  const result: Result<
    PublishedEntity,
    | typeof ErrorType.BadRequest
    | typeof ErrorType.NotFound
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  >[] = [];
  for (const reference of references) {
    const entityMain = entitiesInfoResult.value.find((it) => it.id === reference.id);
    result.push(await mapItem(adminSchema, authorizationAdapter, context, reference, entityMain));
  }

  return ok(result);
}

async function mapItem(
  adminSchema: AdminSchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  reference: EntityReference,
  values: DatabasePublishedEntityGetOnePayload | undefined,
): PromiseResult<
  PublishedEntity,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotFound
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  if (!values) {
    return notOk.NotFound('No such entity');
  }

  const authResult = await authVerifyAuthorizationKey(authorizationAdapter, context, {
    authKey: values.authKey,
    resolvedAuthKey: values.resolvedAuthKey,
  });
  if (authResult.isError()) return authResult;

  return decodePublishedEntity(adminSchema, values);
}
