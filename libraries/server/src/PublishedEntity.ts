import type {
  Connection,
  Edge,
  EntityReferenceWithAuthKeys,
  ErrorType,
  Paging,
  PromiseResult,
  PublishedEntity,
  PublishedQuery,
  Result,
  Schema,
} from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '.';
import { authResolveAuthorizationKeys, authVerifyAuthorizationKey } from './Auth';
import * as Db from './Database';
import type { EntitiesTable, EntityVersionsTable } from './DatabaseTables';
import { decodePublishedEntity } from './EntityCodec';
import { sharedSearchEntities } from './EntitySearcher';
import type { SearchPublishedEntitiesItem } from './QueryGenerator';
import { searchPublishedEntitiesQuery, totalPublishedEntitiesQuery } from './QueryGenerator';

export async function getEntity(
  schema: Schema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  reference: EntityReferenceWithAuthKeys
): PromiseResult<
  PublishedEntity,
  ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const entityMain = await Db.queryNoneOrOne<
    Pick<
      EntitiesTable,
      'uuid' | 'type' | 'name' | 'auth_key' | 'resolved_auth_key' | 'created_at'
    > &
      Pick<EntityVersionsTable, 'data'>
  >(
    databaseAdapter,
    context,
    `SELECT e.uuid, e.type, e.name, e,auth_key, e.resolved_auth_key, e.created_at, ev.data
      FROM entities e, entity_versions ev
      WHERE e.uuid = $1
      AND e.published_entity_versions_id = ev.id`,
    [reference.id]
  );
  if (!entityMain) {
    return notOk.NotFound('No such entity');
  }

  const authResult = await authVerifyAuthorizationKey(
    authorizationAdapter,
    context,
    reference?.authKeys,
    { authKey: entityMain.auth_key, resolvedAuthKey: entityMain.resolved_auth_key }
  );
  if (authResult.isError()) {
    return authResult;
  }

  const entity = decodePublishedEntity(schema, entityMain);

  return ok(entity);
}

/**
 * Fetches published entities. The entities are returned in the same order as in `ids`.
 *
 * If any of the entities are missing that item is returned as an error but the others are returned
 * as normal.
 * @param context The session context
 * @param ids The ids of the entities
 */
export async function getEntities(
  schema: Schema,
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

  async function mapItem(
    reference: EntityReferenceWithAuthKeys,
    entityMain: typeof entitiesMain[0] | undefined
  ): PromiseResult<
    PublishedEntity,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
  > {
    if (!entityMain) {
      return notOk.NotFound('No such entity');
    }

    const authResult = await authVerifyAuthorizationKey(
      authorizationAdapter,
      context,
      reference.authKeys,
      { authKey: entityMain.auth_key, resolvedAuthKey: entityMain.resolved_auth_key }
    );
    if (authResult.isError()) {
      return authResult;
    }

    const entity = decodePublishedEntity(schema, entityMain);
    return ok(entity);
  }

  const result: Result<
    PublishedEntity,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
  >[] = [];
  for (const reference of references) {
    const entityMain = entitiesMain.find((it) => it.uuid === reference.id);
    result.push(await mapItem(reference, entityMain));
  }

  return ok(result);
}

export async function getTotalCount(
  schema: Schema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: PublishedQuery | undefined
): PromiseResult<number, ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic> {
  const authKeysResult = await authResolveAuthorizationKeys(
    authorizationAdapter,
    context,
    query?.authKeys
  );
  if (authKeysResult.isError()) {
    return authKeysResult;
  }

  const sqlQuery = totalPublishedEntitiesQuery(schema, authKeysResult.value, query);
  if (sqlQuery.isError()) {
    return sqlQuery;
  }

  const { count } = await Db.queryOne<{ count: number }>(databaseAdapter, context, sqlQuery.value);
  return ok(count);
}

export async function searchEntities(
  schema: Schema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: PublishedQuery | undefined,
  paging: Paging | undefined
): PromiseResult<
  Connection<Edge<PublishedEntity, ErrorType>> | null,
  ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const authKeysResult = await authResolveAuthorizationKeys(
    authorizationAdapter,
    context,
    query?.authKeys
  );
  if (authKeysResult.isError()) {
    return authKeysResult;
  }

  const sqlQueryResult = searchPublishedEntitiesQuery(schema, query, paging, authKeysResult.value);
  if (sqlQueryResult.isError()) {
    return sqlQueryResult;
  }

  return await sharedSearchEntities<Schema, PublishedEntity, SearchPublishedEntitiesItem>(
    schema,
    databaseAdapter,
    context,
    sqlQueryResult.value,
    decodePublishedEntity
  );
}
