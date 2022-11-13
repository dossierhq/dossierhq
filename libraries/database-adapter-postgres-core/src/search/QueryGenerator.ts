import type {
  AdminQuery,
  AdminSchema,
  AdminSearchQuery,
  ErrorType,
  PublishedQuery,
  PublishedSchema,
  PublishedSearchQuery,
  Result,
} from '@jonasb/datadata-core';
import {
  AdminQueryOrder,
  assertExhaustive,
  notOk,
  ok,
  PublishedQueryOrder,
} from '@jonasb/datadata-core';
import type {
  DatabasePagingInfo,
  PostgresQueryBuilder,
  ResolvedAuthKey,
} from '@jonasb/datadata-database-adapter';
import { createPostgresSqlQuery } from '@jonasb/datadata-database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import type { CursorNativeType } from './OpaqueCursor.js';
import { toOpaqueCursor } from './OpaqueCursor.js';
import { resolvePagingCursors } from './Paging.js';

// id and updated are included for order by
export type SearchAdminEntitiesItem = Pick<
  EntitiesTable,
  'id' | 'uuid' | 'type' | 'name' | 'auth_key' | 'created_at' | 'updated_at' | 'updated' | 'status'
> &
  Pick<EntityVersionsTable, 'version' | 'data'>;
export type SearchPublishedEntitiesItem = Pick<
  EntitiesTable,
  'id' | 'uuid' | 'type' | 'name' | 'auth_key' | 'created_at'
> &
  Pick<EntityVersionsTable, 'data'>;

type CursorName = 'name' | 'updated' | 'id';

export interface SharedEntitiesQuery<TItem> {
  sqlQuery: { text: string; values: unknown[] };
  cursorExtractor: (item: TItem) => string;
}

export function searchPublishedEntitiesQuery(
  databaseAdapter: PostgresDatabaseAdapter,
  schema: PublishedSchema,
  query: PublishedSearchQuery | undefined,
  paging: DatabasePagingInfo,
  authKeys: ResolvedAuthKey[]
): Result<SharedEntitiesQuery<SearchPublishedEntitiesItem>, typeof ErrorType.BadRequest> {
  return sharedSearchEntitiesQuery(databaseAdapter, schema, query, paging, authKeys, true);
}

export function searchAdminEntitiesQuery(
  databaseAdapter: PostgresDatabaseAdapter,
  schema: AdminSchema,
  query: AdminSearchQuery | undefined,
  paging: DatabasePagingInfo,
  authKeys: ResolvedAuthKey[]
): Result<SharedEntitiesQuery<SearchAdminEntitiesItem>, typeof ErrorType.BadRequest> {
  return sharedSearchEntitiesQuery(databaseAdapter, schema, query, paging, authKeys, false);
}

function sharedSearchEntitiesQuery<
  TItem extends SearchAdminEntitiesItem | SearchPublishedEntitiesItem
>(
  databaseAdapter: PostgresDatabaseAdapter,
  schema: AdminSchema | PublishedSchema,
  query: PublishedSearchQuery | AdminSearchQuery | undefined,
  paging: DatabasePagingInfo,
  authKeys: ResolvedAuthKey[],
  published: boolean
): Result<SharedEntitiesQuery<TItem>, typeof ErrorType.BadRequest> {
  const { cursorType, cursorName, cursorExtractor } = queryOrderToCursor<TItem>(
    databaseAdapter,
    query?.order,
    published
  );

  const cursorsResult = resolvePagingCursors(databaseAdapter, cursorType, paging);
  if (cursorsResult.isError()) return cursorsResult;
  const resolvedCursors = cursorsResult.value;

  const queryBuilder = createPostgresSqlQuery();
  const { sql } = queryBuilder;

  sql`SELECT`;
  addEntityQuerySelectColumn(queryBuilder, query, published);

  sql`WHERE`;

  const filterResult = addQueryFilters(queryBuilder, schema, query, authKeys, published, true);
  if (filterResult.isError()) return filterResult;

  // Paging 1/2
  if (resolvedCursors.after !== null) {
    const operator = query?.reverse ? '<' : '>';
    sql`AND e.`;
    addCursorNameOperatorAndValue(
      queryBuilder,
      cursorName,
      operator,
      paging.afterInclusive,
      resolvedCursors.after as string
    );
  }
  if (resolvedCursors.before !== null) {
    const operator = query?.reverse ? '>' : '<';
    sql`AND e.`;
    addCursorNameOperatorAndValue(
      queryBuilder,
      cursorName,
      operator,
      paging.beforeInclusive,
      resolvedCursors.before as string
    );
  }

  // Ordering
  sql`ORDER BY e.`;
  addCursorName(queryBuilder, cursorName);
  let ascending = !query?.reverse;

  // Paging 2/2
  if (!paging.forwards) ascending = !ascending;
  const countToRequest = paging.count + 1; // request one more to calculate hasMore
  if (!ascending) sql`DESC`;
  sql`LIMIT ${countToRequest}`;

  return ok({
    sqlQuery: queryBuilder.query,
    cursorExtractor,
  });
}

function queryOrderToCursor<TItem extends SearchAdminEntitiesItem | SearchPublishedEntitiesItem>(
  databaseAdapter: PostgresDatabaseAdapter,
  order: PublishedQueryOrder | AdminQueryOrder | undefined,
  published: boolean
): {
  cursorName: CursorName;
  cursorType: CursorNativeType;
  cursorExtractor: (item: TItem) => string;
} {
  if (published) {
    switch (order) {
      case PublishedQueryOrder.name: {
        const cursorType = 'string';
        const cursorName = 'name';
        return {
          cursorType,
          cursorName,
          cursorExtractor: (item: TItem) =>
            toOpaqueCursor(databaseAdapter, cursorType, item[cursorName]),
        };
      }
      case PublishedQueryOrder.createdAt:
      default: {
        const cursorType = 'int';
        const cursorName = 'id';
        return {
          cursorType,
          cursorName,
          cursorExtractor: (item: TItem) =>
            toOpaqueCursor(databaseAdapter, cursorType, item[cursorName]),
        };
      }
    }
  }
  switch (order) {
    case AdminQueryOrder.name: {
      const cursorType = 'string';
      const cursorName = 'name';
      return {
        cursorType,
        cursorName,
        cursorExtractor: (item: TItem) =>
          toOpaqueCursor(databaseAdapter, cursorType, item[cursorName]),
      };
    }
    case AdminQueryOrder.updatedAt: {
      const cursorType = 'int';
      const cursorName = 'updated';
      return {
        cursorType,
        cursorName,
        cursorExtractor: (item: TItem) =>
          toOpaqueCursor(
            databaseAdapter,
            cursorType,
            (item as SearchAdminEntitiesItem)[cursorName]
          ),
      };
    }
    case AdminQueryOrder.createdAt:
    default: {
      const cursorType = 'int';
      const cursorName = 'id';
      return {
        cursorType,
        cursorName,
        cursorExtractor: (item: TItem) =>
          toOpaqueCursor(databaseAdapter, cursorType, item[cursorName]),
      };
    }
  }
}

function addCursorName({ sql }: PostgresQueryBuilder, cursorName: CursorName) {
  switch (cursorName) {
    case 'id':
      sql`id`;
      break;
    case 'name':
      sql`name`;
      break;
    case 'updated':
      sql`updated`;
      break;
    default:
      assertExhaustive(cursorName);
  }
}

function addCursorNameOperatorAndValue(
  queryBuilder: PostgresQueryBuilder,
  cursorName: CursorName,
  operator: '>' | '<',
  orEqual: boolean,
  value: string
) {
  const { sql } = queryBuilder;

  addCursorName(queryBuilder, cursorName);
  switch (operator) {
    case '>':
      if (orEqual) sql`>=`;
      else sql`>`;
      break;
    case '<':
      if (orEqual) sql`<=`;
      else sql`<`;
      break;
    default:
      assertExhaustive(operator);
  }
  sql`${value}`;
}

function addFilterStatusSqlSegment(query: AdminQuery, { sql }: PostgresQueryBuilder) {
  if (!query.status || query.status.length === 0) {
    return;
  }
  if (query.status.length === 1) {
    sql`AND status = ${query.status[0]}`;
  } else {
    sql`AND status = ANY(${query.status})`;
  }
}

export function sampleAdminEntitiesQuery(
  schema: AdminSchema,
  query: AdminQuery | undefined,
  offset: number,
  limit: number,
  authKeys: ResolvedAuthKey[]
): Result<{ text: string; values: unknown[] }, typeof ErrorType.BadRequest> {
  return sampleEntitiesQuery(schema, query, offset, limit, authKeys, false);
}

export function samplePublishedEntitiesQuery(
  schema: PublishedSchema,
  query: PublishedQuery | undefined,
  offset: number,
  limit: number,
  authKeys: ResolvedAuthKey[]
): Result<{ text: string; values: unknown[] }, typeof ErrorType.BadRequest> {
  return sampleEntitiesQuery(schema, query, offset, limit, authKeys, true);
}

function sampleEntitiesQuery(
  schema: AdminSchema | PublishedSchema,
  query: AdminQuery | PublishedQuery | undefined,
  offset: number,
  limit: number,
  authKeys: ResolvedAuthKey[],
  published: boolean
): Result<{ text: string; values: unknown[] }, typeof ErrorType.BadRequest> {
  const queryBuilder = createPostgresSqlQuery();
  const { sql } = queryBuilder;

  sql`SELECT`;

  addEntityQuerySelectColumn(queryBuilder, query, published);

  sql`WHERE`;

  const filterResult = addQueryFilters(queryBuilder, schema, query, authKeys, published, true);
  if (filterResult.isError()) return filterResult;

  sql`ORDER BY e.uuid LIMIT ${limit} OFFSET ${offset}`;

  return ok(queryBuilder.query);
}

export function totalAdminEntitiesQuery(
  schema: AdminSchema,
  authKeys: ResolvedAuthKey[],
  query: AdminQuery | undefined
): Result<{ text: string; values: unknown[] }, typeof ErrorType.BadRequest> {
  return totalCountQuery(schema, authKeys, query, false);
}

export function totalPublishedEntitiesQuery(
  schema: PublishedSchema,
  authKeys: ResolvedAuthKey[],
  query: PublishedQuery | undefined
): Result<{ text: string; values: unknown[] }, typeof ErrorType.BadRequest> {
  return totalCountQuery(schema, authKeys, query, true);
}

function totalCountQuery(
  schema: AdminSchema | PublishedSchema,
  authKeys: ResolvedAuthKey[],
  query: AdminQuery | PublishedQuery | undefined,
  published: boolean
): Result<{ text: string; values: unknown[] }, typeof ErrorType.BadRequest> {
  const queryBuilder = createPostgresSqlQuery();
  const { sql } = queryBuilder;

  sql`SELECT`;
  // Convert count to ::integer since count() is bigint (js doesn't support 64 bit numbers so pg return it as string)
  if (query?.boundingBox) {
    sql`COUNT(DISTINCT e.id)::integer`;
  } else {
    sql`COUNT(e.id)::integer`;
  }
  sql`AS count FROM entities e`;

  if (query?.linksTo) {
    if (published) sql`entity_published_references er_to, entities e_to`;
    else sql`entity_latest_references er_to, entities e_to`;
  }
  if (query?.linksFrom) {
    if (published) sql`entity_published_references er_from, entities e_from`;
    else sql`entity_latest_references er_from, entities e_from`;
  }
  if (query?.boundingBox) {
    if (published) sql`entity_published_locations el`;
    else sql`entity_latest_locations el`;
  }

  sql`WHERE`;

  const filterResult = addQueryFilters(queryBuilder, schema, query, authKeys, published, false);
  if (filterResult.isError()) return filterResult;

  return ok(queryBuilder.query);
}

function addEntityQuerySelectColumn(
  { sql }: PostgresQueryBuilder,
  query: PublishedQuery | AdminQuery | undefined,
  published: boolean
) {
  if (query?.boundingBox) {
    sql`DISTINCT`;
  }
  // TODO could skip some columns depending on sample/search and sort order
  if (published) {
    sql`e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev`;
  } else {
    sql`e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
  FROM entities e, entity_versions ev`;
  }
  if (query?.linksTo) {
    if (published) sql`entity_published_references er_to, entities e_to`;
    else sql`entity_latest_references er_to, entities e_to`;
  }
  if (query?.linksFrom) {
    if (published) sql`entities e_from, entity_published_references er_from`;
    else sql`entities e_from, entity_latest_references er_from`;
  }
  if (query?.boundingBox) {
    if (published) sql`entity_published_locations el`;
    else sql`entity_latest_locations el`;
  }
}

function addQueryFilters(
  queryBuilder: PostgresQueryBuilder,
  schema: AdminSchema | PublishedSchema,
  query: PublishedQuery | AdminQuery | undefined,
  authKeys: ResolvedAuthKey[],
  published: boolean,
  linkToEntityVersion: boolean
): Result<void, typeof ErrorType.BadRequest> {
  const { sql } = queryBuilder;
  if (linkToEntityVersion) {
    if (published) {
      sql`AND e.published_entity_versions_id = ev.id`;
    } else {
      sql`AND e.latest_draft_entity_versions_id = ev.id`;
    }
  } else if (published) {
    sql`AND e.published_entity_versions_id IS NOT NULL`;
  }

  // Filter: authKeys
  if (authKeys.length === 0) {
    return notOk.BadRequest('No authKeys provided');
  } else if (authKeys.length === 1) {
    sql`AND e.resolved_auth_key = ${authKeys[0].resolvedAuthKey}`;
  } else {
    sql`AND e.resolved_auth_key = ANY(${authKeys.map((it) => it.resolvedAuthKey)})`;
  }

  // Filter: entityTypes
  const entityTypesResult = getFilterEntityTypes(schema, query);
  if (entityTypesResult.isError()) return entityTypesResult;
  if (entityTypesResult.value.length > 0) {
    sql`AND e.type = ANY(${entityTypesResult.value})`;
  }

  // Filter: status
  if (!published && query && 'status' in query) {
    addFilterStatusSqlSegment(query, queryBuilder);
  }

  // Filter: linksTo
  if (query?.linksTo) {
    sql`AND e.id = er_to.from_entities_id AND er_to.to_entities_id = e_to.id AND e_to.uuid = ${query.linksTo.id}`;
  }

  // Filter: linksFrom
  if (query?.linksFrom) {
    sql`AND e_from.uuid = ${query.linksFrom.id}`;
    sql`AND e_from.id = er_from.from_entities_id AND er_from.to_entities_id = e.id`;
  }

  // Filter: bounding box
  if (query?.boundingBox) {
    const { minLat, maxLat, minLng, maxLng } = query.boundingBox;
    sql`AND e.id = el.entities_id AND el.location && ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)`;
  }

  // Filter: text
  if (query?.text) {
    if (published) {
      sql`AND e.published_fts @@ websearch_to_tsquery(${query.text})`;
    } else {
      sql`AND e.latest_fts @@ websearch_to_tsquery(${query.text})`;
    }
  }

  return ok(undefined);
}

function getFilterEntityTypes(
  schema: PublishedSchema | AdminSchema,
  query: PublishedQuery | AdminQuery | undefined
): Result<string[], typeof ErrorType.BadRequest> {
  if (!query?.entityTypes || query.entityTypes.length === 0) {
    return ok([]);
  }
  for (const entityType of query.entityTypes) {
    if (schema.getEntityTypeSpecification(entityType) === null) {
      return notOk.BadRequest(`Can’t find entity type in query: ${entityType}`);
    }
  }
  return ok(query.entityTypes);
}
