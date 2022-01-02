import type {
  EntityReference,
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
  TransactionContext,
} from '..';
import { authVerifyAuthorizationKey } from '../Auth';
import * as Db from '../Database';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseTables';
import { decodePublishedEntity2 } from '../EntityCodec';

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
  const entitiesInfoResult = await publishedEntityGetEntities(databaseAdapter, context, references);
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

async function publishedEntityGetEntities(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  references: EntityReference[]
): PromiseResult<DatabasePublishedEntityGetOnePayload[], ErrorType.Generic> {
  const entitiesMain = await Db.queryMany<
    Pick<
      EntitiesTable,
      'uuid' | 'type' | 'name' | 'auth_key' | 'resolved_auth_key' | 'created_at'
    > &
      Pick<EntityVersionsTable, 'data'>
  >(
    databaseAdapter,
    context,
    `SELECT e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, ev.data
      FROM entities e, entity_versions ev
      WHERE e.uuid = ANY($1)
      AND e.published_entity_versions_id = ev.id`,
    [references.map((it) => it.id)]
  );
  return ok(
    entitiesMain.map((row) => ({
      id: row.uuid,
      type: row.type,
      name: row.name,
      authKey: row.auth_key,
      resolvedAuthKey: row.resolved_auth_key,
      createdAt: row.created_at,
      fieldValues: row.data,
    }))
  );
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

  const entity = decodePublishedEntity2(schema, values);
  return ok(entity);
}
