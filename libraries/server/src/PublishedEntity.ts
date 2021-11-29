import type {
  Connection,
  Edge,
  Entity,
  EntityReference,
  ErrorType,
  Paging,
  PromiseResult,
  Query,
  Result,
  Schema,
} from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '.';
import { authVerifyAuthorizationKey } from './Auth';
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
  reference: EntityReference,
  options: { authKeys: string[] } | undefined
): PromiseResult<
  Entity,
  ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const entityMain = await Db.queryNoneOrOne<
    Pick<EntitiesTable, 'uuid' | 'type' | 'name' | 'auth_key' | 'resolved_auth_key'> &
      Pick<EntityVersionsTable, 'data'>
  >(
    databaseAdapter,
    context,
    `SELECT e.uuid, e.type, e.name, e,auth_key, e.resolved_auth_key, ev.data
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
    options?.authKeys,
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
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  ids: string[]
): PromiseResult<Result<Entity, ErrorType.NotFound>[], ErrorType.Generic> {
  if (ids.length === 0) {
    return ok([]);
  }
  const entitiesMain = await Db.queryMany<
    Pick<EntitiesTable, 'uuid' | 'type' | 'name' | 'auth_key'> & Pick<EntityVersionsTable, 'data'>
  >(
    databaseAdapter,
    context,
    `SELECT e.uuid, e.type, e.name, e.auth_key, ev.data
      FROM entities e, entity_versions ev
      WHERE e.uuid = ANY($1)
      AND e.published_entity_versions_id = ev.id`,
    [ids]
  );

  const result: Result<Entity, ErrorType.NotFound>[] = ids.map((id) => {
    const entityMain = entitiesMain.find((x) => x.uuid === id);
    if (!entityMain) {
      return notOk.NotFound('No such entity');
    }
    const entity = decodePublishedEntity(schema, entityMain);
    return ok(entity);
  });

  return ok(result);
}

export async function getTotalCount(
  schema: Schema,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: Query | undefined
): PromiseResult<number, ErrorType.BadRequest> {
  const sqlQuery = totalPublishedEntitiesQuery(schema, query);
  if (sqlQuery.isError()) {
    return sqlQuery;
  }

  const { count } = await Db.queryOne<{ count: number }>(databaseAdapter, context, sqlQuery.value);
  return ok(count);
}

export async function searchEntities(
  schema: Schema,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: Query | undefined,
  paging: Paging | undefined
): PromiseResult<Connection<Edge<Entity, ErrorType>> | null, ErrorType.BadRequest> {
  const sqlQueryResult = searchPublishedEntitiesQuery(schema, query, paging);
  if (sqlQueryResult.isError()) {
    return sqlQueryResult;
  }

  return await sharedSearchEntities<Schema, Entity, SearchPublishedEntitiesItem>(
    schema,
    databaseAdapter,
    context,
    sqlQueryResult.value,
    decodePublishedEntity
  );
}
