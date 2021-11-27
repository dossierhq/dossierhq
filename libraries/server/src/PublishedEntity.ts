import type {
  Connection,
  Edge,
  Entity,
  ErrorType,
  Paging,
  PromiseResult,
  Query,
  Result,
  Schema,
} from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter, SessionContext } from '.';
import * as Db from './Database';
import type { EntitiesTable, EntityVersionsTable } from './DatabaseTables';
import { decodePublishedEntity } from './EntityCodec';
import { sharedSearchEntities } from './EntitySearcher';
import type { SearchPublishedEntitiesItem } from './QueryGenerator';
import { searchPublishedEntitiesQuery, totalPublishedEntitiesQuery } from './QueryGenerator';

export async function getEntity(
  schema: Schema,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  id: string
): PromiseResult<Entity, ErrorType.NotFound> {
  const entityMain = await Db.queryNoneOrOne<
    Pick<EntitiesTable, 'uuid' | 'type' | 'name'> & Pick<EntityVersionsTable, 'data'>
  >(
    databaseAdapter,
    context,
    `SELECT e.uuid, e.type, e.name, ev.data
      FROM entities e, entity_versions ev
      WHERE e.uuid = $1
      AND e.published_entity_versions_id = ev.id`,
    [id]
  );
  if (!entityMain) {
    return notOk.NotFound('No such entity');
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
    Pick<EntitiesTable, 'uuid' | 'type' | 'name'> & Pick<EntityVersionsTable, 'data'>
  >(
    databaseAdapter,
    context,
    `SELECT e.uuid, e.type, e.name, ev.data
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
