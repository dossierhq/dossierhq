import type {
  AdminEntityQuery,
  AdminEntitySharedQuery,
  AdminSchema,
  ErrorType,
  PublishedEntityQuery,
  PublishedEntitySharedQuery,
  PublishedSchema,
  Result,
} from '@dossierhq/core';
import {
  AdminEntityQueryOrder,
  PublishedEntityQueryOrder,
  assertExhaustive,
  notOk,
  ok,
} from '@dossierhq/core';
import type {
  DatabasePagingInfo,
  PostgresQueryBuilder,
  ResolvedAuthKey,
} from '@dossierhq/database-adapter';
import { createPostgresSqlQuery } from '@dossierhq/database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import type { CursorNativeType } from './OpaqueCursor.js';
import { toOpaqueCursor } from './OpaqueCursor.js';
import { resolvePagingCursors } from './Paging.js';

// id and updated are included for order by
export type SearchAdminEntitiesItem = Pick<
  EntitiesTable,
  | 'id'
  | 'uuid'
  | 'type'
  | 'name'
  | 'auth_key'
  | 'created_at'
  | 'updated_at'
  | 'updated'
  | 'status'
  | 'invalid'
> &
  Pick<EntityVersionsTable, 'version' | 'schema_version' | 'encode_version' | 'data'>;
export type SearchPublishedEntitiesItem = Pick<
  EntitiesTable,
  'id' | 'uuid' | 'type' | 'published_name' | 'auth_key' | 'created_at' | 'invalid'
> &
  Pick<EntityVersionsTable, 'schema_version' | 'encode_version' | 'data'>;

type CursorName = 'name' | 'updated' | 'id';

export interface SharedEntitiesQuery<TItem> {
  sqlQuery: { text: string; values: unknown[] };
  cursorExtractor: (item: TItem) => string;
}

export function searchPublishedEntitiesQuery(
  databaseAdapter: PostgresDatabaseAdapter,
  schema: PublishedSchema,
  query: PublishedEntityQuery | undefined,
  paging: DatabasePagingInfo,
  authKeys: ResolvedAuthKey[],
): Result<SharedEntitiesQuery<SearchPublishedEntitiesItem>, typeof ErrorType.BadRequest> {
  return sharedSearchEntitiesQuery(databaseAdapter, schema, query, paging, authKeys, true);
}

export function searchAdminEntitiesQuery(
  databaseAdapter: PostgresDatabaseAdapter,
  schema: AdminSchema,
  query: AdminEntityQuery | undefined,
  paging: DatabasePagingInfo,
  authKeys: ResolvedAuthKey[],
): Result<SharedEntitiesQuery<SearchAdminEntitiesItem>, typeof ErrorType.BadRequest> {
  return sharedSearchEntitiesQuery(databaseAdapter, schema, query, paging, authKeys, false);
}

function sharedSearchEntitiesQuery<
  TItem extends SearchAdminEntitiesItem | SearchPublishedEntitiesItem,
>(
  databaseAdapter: PostgresDatabaseAdapter,
  schema: AdminSchema | PublishedSchema,
  query: PublishedEntityQuery | AdminEntityQuery | undefined,
  paging: DatabasePagingInfo,
  authKeys: ResolvedAuthKey[],
  published: boolean,
): Result<SharedEntitiesQuery<TItem>, typeof ErrorType.BadRequest> {
  const { cursorType, cursorName, cursorExtractor } = queryOrderToCursor<TItem>(
    databaseAdapter,
    query?.order,
    published,
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
      published,
      queryBuilder,
      cursorName,
      operator,
      paging.afterInclusive,
      resolvedCursors.after as string,
    );
  }
  if (resolvedCursors.before !== null) {
    const operator = query?.reverse ? '>' : '<';
    sql`AND e.`;
    addCursorNameOperatorAndValue(
      published,
      queryBuilder,
      cursorName,
      operator,
      paging.beforeInclusive,
      resolvedCursors.before as string,
    );
  }

  // Ordering
  sql`ORDER BY e.`;
  addCursorName(published, queryBuilder, cursorName);
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
  order: PublishedEntityQueryOrder | AdminEntityQueryOrder | undefined,
  published: boolean,
): {
  cursorName: CursorName;
  cursorType: CursorNativeType;
  cursorExtractor: (item: TItem) => string;
} {
  if (published) {
    switch (order) {
      case PublishedEntityQueryOrder.name: {
        const cursorType = 'string';
        const cursorName = 'name';
        return {
          cursorType,
          cursorName,
          cursorExtractor: (item: TItem) =>
            toOpaqueCursor(
              databaseAdapter,
              cursorType,
              (item as SearchPublishedEntitiesItem).published_name,
            ),
        };
      }
      case PublishedEntityQueryOrder.createdAt:
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
    case AdminEntityQueryOrder.name: {
      const cursorType = 'string';
      const cursorName = 'name';
      return {
        cursorType,
        cursorName,
        cursorExtractor: (item: TItem) =>
          toOpaqueCursor(
            databaseAdapter,
            cursorType,
            (item as SearchAdminEntitiesItem)[cursorName],
          ),
      };
    }
    case AdminEntityQueryOrder.updatedAt: {
      const cursorType = 'int';
      const cursorName = 'updated';
      return {
        cursorType,
        cursorName,
        cursorExtractor: (item: TItem) =>
          toOpaqueCursor(
            databaseAdapter,
            cursorType,
            (item as SearchAdminEntitiesItem)[cursorName],
          ),
      };
    }
    case AdminEntityQueryOrder.createdAt:
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

function addCursorName(published: boolean, { sql }: PostgresQueryBuilder, cursorName: CursorName) {
  switch (cursorName) {
    case 'id':
      sql`id`;
      break;
    case 'name':
      if (published) {
        sql`published_name`;
      } else {
        sql`name`;
      }
      break;
    case 'updated':
      sql`updated`;
      break;
    default:
      assertExhaustive(cursorName);
  }
}

function addCursorNameOperatorAndValue(
  published: boolean,
  queryBuilder: PostgresQueryBuilder,
  cursorName: CursorName,
  operator: '>' | '<',
  orEqual: boolean,
  value: string,
) {
  const { sql } = queryBuilder;

  addCursorName(published, queryBuilder, cursorName);
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

function addFilterStatusSqlSegment(query: AdminEntitySharedQuery, { sql }: PostgresQueryBuilder) {
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
  query: AdminEntitySharedQuery | undefined,
  offset: number,
  limit: number,
  authKeys: ResolvedAuthKey[],
): Result<{ text: string; values: unknown[] }, typeof ErrorType.BadRequest> {
  return sampleEntitiesQuery(schema, query, offset, limit, authKeys, false);
}

export function samplePublishedEntitiesQuery(
  schema: PublishedSchema,
  query: PublishedEntitySharedQuery | undefined,
  offset: number,
  limit: number,
  authKeys: ResolvedAuthKey[],
): Result<{ text: string; values: unknown[] }, typeof ErrorType.BadRequest> {
  return sampleEntitiesQuery(schema, query, offset, limit, authKeys, true);
}

function sampleEntitiesQuery(
  schema: AdminSchema | PublishedSchema,
  query: AdminEntitySharedQuery | PublishedEntitySharedQuery | undefined,
  offset: number,
  limit: number,
  authKeys: ResolvedAuthKey[],
  published: boolean,
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
  query: AdminEntitySharedQuery | undefined,
): Result<{ text: string; values: unknown[] }, typeof ErrorType.BadRequest> {
  return totalCountQuery(schema, authKeys, query, false);
}

export function totalPublishedEntitiesQuery(
  schema: PublishedSchema,
  authKeys: ResolvedAuthKey[],
  query: PublishedEntitySharedQuery | undefined,
): Result<{ text: string; values: unknown[] }, typeof ErrorType.BadRequest> {
  return totalCountQuery(schema, authKeys, query, true);
}

function totalCountQuery(
  schema: AdminSchema | PublishedSchema,
  authKeys: ResolvedAuthKey[],
  query: AdminEntitySharedQuery | PublishedEntitySharedQuery | undefined,
  published: boolean,
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
  if (query?.valueTypes && query.valueTypes.length > 0) {
    if (published) {
      sql`entity_published_value_types evt`;
    } else {
      sql`entity_latest_value_types evt`;
    }
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
  query: PublishedEntitySharedQuery | AdminEntitySharedQuery | undefined,
  published: boolean,
) {
  if (query?.boundingBox) {
    sql`DISTINCT`;
  }
  // TODO could skip some columns depending on sample/search and sort order
  if (published) {
    sql`e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.invalid, ev.schema_version, ev.encode_version, ev.data FROM entities e, entity_versions ev`;
  } else {
    sql`e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, e.invalid, ev.version, ev.schema_version, ev.encode_version, ev.data
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
  if (query?.valueTypes && query.valueTypes.length > 0) {
    if (published) sql`entity_published_value_types evt`;
    else sql`entity_latest_value_types evt`;
  }
  if (query?.boundingBox) {
    if (published) sql`entity_published_locations el`;
    else sql`entity_latest_locations el`;
  }
}

function addQueryFilters(
  queryBuilder: PostgresQueryBuilder,
  schema: AdminSchema | PublishedSchema,
  query: PublishedEntitySharedQuery | AdminEntitySharedQuery | undefined,
  authKeys: ResolvedAuthKey[],
  published: boolean,
  linkToEntityVersion: boolean,
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

  // Filter: valueTypes
  const valueTypesResult = getFilterValueTypes(schema, query);
  if (valueTypesResult.isError()) return valueTypesResult;

  if (valueTypesResult.value.length > 0) {
    sql`AND evt.value_type = ANY(${valueTypesResult.value}) AND evt.entities_id = e.id`;
  }

  // Filter: status
  if (!published && query && 'status' in query) {
    addFilterStatusSqlSegment(query, queryBuilder);
  }

  // Filter: valid
  if (!published && query && 'valid' in query) {
    if (query.valid === true) {
      sql`AND e.invalid = 0`;
    } else if (query.valid === false) {
      sql`AND e.invalid != 0`;
    }
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
  query: PublishedEntitySharedQuery | AdminEntitySharedQuery | undefined,
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

function getFilterValueTypes(
  schema: PublishedSchema | AdminSchema,
  query: PublishedEntitySharedQuery | AdminEntitySharedQuery | undefined,
): Result<string[], typeof ErrorType.BadRequest> {
  if (!query?.valueTypes || query.valueTypes.length === 0) {
    return ok([]);
  }
  for (const valueType of query.valueTypes) {
    if (schema.getValueTypeSpecification(valueType) === null) {
      return notOk.BadRequest(`Can’t find value type in query: ${valueType}`);
    }
  }
  return ok(query.valueTypes);
}
