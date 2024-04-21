import type {
  EntityQuery,
  EntitySharedQuery,
  Schema,
  ErrorType,
  PublishedEntityQuery,
  PublishedEntitySharedQuery,
  PublishedSchema,
  Result,
} from '@dossierhq/core';
import { EntityQueryOrder, PublishedEntityQueryOrder, notOk, ok } from '@dossierhq/core';
import type {
  DatabasePagingInfo,
  ResolvedAuthKey,
  SqliteQueryBuilder,
  SqliteSqlTemplateTag,
} from '@dossierhq/database-adapter';
import { createSqliteSqlQuery } from '@dossierhq/database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import type { ColumnValue } from '../SqliteDatabaseAdapter.js';
import { assertExhaustive } from '../utils/AssertUtils.js';
import {
  addConnectionOrderByAndLimit,
  addConnectionPagingFilter,
} from '../utils/ConnectionUtils.js';
import type { CursorNativeType } from './OpaqueCursor.js';
import { toOpaqueCursor } from './OpaqueCursor.js';

// id and updated_seq are included for order by
export type SearchAdminEntitiesItem = Pick<
  EntitiesTable,
  | 'id'
  | 'uuid'
  | 'type'
  | 'name'
  | 'auth_key'
  | 'created_at'
  | 'updated_at'
  | 'updated_seq'
  | 'status'
  | 'invalid'
> &
  Pick<EntityVersionsTable, 'version' | 'schema_version' | 'encode_version' | 'fields'>;
export type SearchPublishedEntitiesItem = Pick<
  EntitiesTable,
  'id' | 'uuid' | 'type' | 'published_name' | 'auth_key' | 'created_at' | 'invalid'
> &
  Pick<EntityVersionsTable, 'schema_version' | 'encode_version' | 'fields'>;

type CursorName = 'name' | 'updated_seq' | 'id';

export interface SharedEntitiesQuery<TItem> {
  sqlQuery: { text: string; values: ColumnValue[] };
  cursorExtractor: (item: TItem) => string;
}

export function searchPublishedEntitiesQuery(
  database: Database,
  schema: PublishedSchema,
  query: PublishedEntityQuery | undefined,
  paging: DatabasePagingInfo,
  authKeys: ResolvedAuthKey[],
): Result<SharedEntitiesQuery<SearchPublishedEntitiesItem>, typeof ErrorType.BadRequest> {
  return sharedSearchEntitiesQuery(database, schema, query, paging, authKeys, true);
}

export function searchAdminEntitiesQuery(
  database: Database,
  schema: Schema,
  query: EntityQuery | undefined,
  paging: DatabasePagingInfo,
  authKeys: ResolvedAuthKey[],
): Result<SharedEntitiesQuery<SearchAdminEntitiesItem>, typeof ErrorType.BadRequest> {
  return sharedSearchEntitiesQuery(database, schema, query, paging, authKeys, false);
}

function sharedSearchEntitiesQuery<
  TItem extends SearchAdminEntitiesItem | SearchPublishedEntitiesItem,
>(
  database: Database,
  schema: Schema | PublishedSchema,
  query: PublishedEntityQuery | EntityQuery | undefined,
  paging: DatabasePagingInfo,
  authKeys: ResolvedAuthKey[],
  published: boolean,
): Result<SharedEntitiesQuery<TItem>, typeof ErrorType.BadRequest> {
  const reverse = !!query?.reverse;

  const { cursorType, cursorName, cursorExtractor } = queryOrderToCursor<TItem>(
    database,
    query?.order,
    published,
  );

  const queryBuilder = createSqliteSqlQuery();
  const { sql } = queryBuilder;
  sql`WITH entities_cte AS (SELECT`;
  addEntityQuerySelectColumn(queryBuilder, query, published);

  sql`WHERE`;

  const filterResult = addQueryFilters(queryBuilder, schema, query, authKeys, published);
  if (filterResult.isError()) return filterResult;

  const pagingFilterResult = addConnectionPagingFilter(
    database,
    sql,
    paging,
    cursorType,
    reverse,
    (sql) => addCursorName(published, sql, cursorName),
  );
  if (pagingFilterResult.isError()) return pagingFilterResult;

  addConnectionOrderByAndLimit(sql, paging, reverse, (sql) =>
    addCursorName(published, sql, cursorName),
  );

  if (published) {
    sql`)
SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id`;
  } else {
    sql`)
SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id`;
  }

  return ok({
    sqlQuery: queryBuilder.query,
    cursorExtractor,
  });
}

function queryOrderToCursor<TItem extends SearchAdminEntitiesItem | SearchPublishedEntitiesItem>(
  database: Database,
  order: PublishedEntityQueryOrder | EntityQueryOrder | undefined,
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
              database,
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
          cursorExtractor: (item: TItem) => toOpaqueCursor(database, cursorType, item[cursorName]),
        };
      }
    }
  }
  switch (order) {
    case EntityQueryOrder.name: {
      const cursorType = 'string';
      const cursorName = 'name';
      return {
        cursorType,
        cursorName,
        cursorExtractor: (item: TItem) =>
          toOpaqueCursor(database, cursorType, (item as SearchAdminEntitiesItem)[cursorName]),
      };
    }
    case EntityQueryOrder.updatedAt: {
      const cursorType = 'int';
      const cursorName = 'updated_seq';
      return {
        cursorType,
        cursorName,
        cursorExtractor: (item: TItem) =>
          toOpaqueCursor(database, cursorType, (item as SearchAdminEntitiesItem)[cursorName]),
      };
    }
    case EntityQueryOrder.createdAt:
    default: {
      const cursorType = 'int';
      const cursorName = 'id';
      return {
        cursorType,
        cursorName,
        cursorExtractor: (item: TItem) => toOpaqueCursor(database, cursorType, item[cursorName]),
      };
    }
  }
}

function addCursorName(published: boolean, sql: SqliteSqlTemplateTag, cursorName: CursorName) {
  switch (cursorName) {
    case 'id':
      sql`e.id`;
      break;
    case 'name':
      if (published) {
        sql`e.published_name`;
      } else {
        sql`e.name`;
      }
      break;
    case 'updated_seq':
      sql`e.updated_seq`;
      break;
    default:
      assertExhaustive(cursorName);
  }
}

function addFilterStatusSqlSegment(
  query: EntitySharedQuery,
  { sql, addValueList }: SqliteQueryBuilder,
) {
  if (!query.status || query.status.length === 0) {
    return;
  }
  if (query.status.length === 1) {
    sql`AND status = ${query.status[0]}`;
  } else {
    sql`AND status IN ${addValueList(query.status)}`;
  }
}

export function sampleAdminEntitiesQuery(
  schema: Schema,
  query: EntitySharedQuery | undefined,
  offset: number,
  limit: number,
  authKeys: ResolvedAuthKey[],
): Result<{ text: string; values: ColumnValue[] }, typeof ErrorType.BadRequest> {
  return sampleEntitiesQuery(schema, query, offset, limit, authKeys, false);
}

export function samplePublishedEntitiesQuery(
  schema: PublishedSchema,
  query: PublishedEntitySharedQuery | undefined,
  offset: number,
  limit: number,
  authKeys: ResolvedAuthKey[],
): Result<{ text: string; values: ColumnValue[] }, typeof ErrorType.BadRequest> {
  return sampleEntitiesQuery(schema, query, offset, limit, authKeys, true);
}

function sampleEntitiesQuery(
  schema: Schema | PublishedSchema,
  query: EntitySharedQuery | PublishedEntitySharedQuery | undefined,
  offset: number,
  limit: number,
  authKeys: ResolvedAuthKey[],
  published: boolean,
): Result<{ text: string; values: ColumnValue[] }, typeof ErrorType.BadRequest> {
  const queryBuilder = createSqliteSqlQuery();
  const { sql } = queryBuilder;

  sql`WITH entities_cte AS (SELECT`;

  addEntityQuerySelectColumn(queryBuilder, query, published);

  sql`WHERE`;

  const filterResult = addQueryFilters(queryBuilder, schema, query, authKeys, published);
  if (filterResult.isError()) return filterResult;

  sql`ORDER BY e.uuid LIMIT ${limit} OFFSET ${offset}`;

  if (published) {
    sql`)
SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id`;
  } else {
    sql`)
SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id`;
  }

  return ok(queryBuilder.query);
}

export function totalAdminEntitiesQuery(
  schema: Schema,
  authKeys: ResolvedAuthKey[],
  query: EntitySharedQuery | undefined,
): Result<{ text: string; values: ColumnValue[] }, typeof ErrorType.BadRequest> {
  return totalCountQuery(schema, authKeys, query, false);
}

export function totalPublishedEntitiesQuery(
  schema: PublishedSchema,
  authKeys: ResolvedAuthKey[],
  query: PublishedEntitySharedQuery | undefined,
): Result<{ text: string; values: ColumnValue[] }, typeof ErrorType.BadRequest> {
  return totalCountQuery(schema, authKeys, query, true);
}

function totalCountQuery(
  schema: Schema | PublishedSchema,
  authKeys: ResolvedAuthKey[],
  query: EntitySharedQuery | PublishedEntitySharedQuery | undefined,
  published: boolean,
): Result<{ text: string; values: ColumnValue[] }, typeof ErrorType.BadRequest> {
  const queryBuilder = createSqliteSqlQuery();
  const { sql } = queryBuilder;
  sql`SELECT`;
  if (query?.boundingBox) {
    sql`COUNT(DISTINCT e.id)`;
  } else {
    sql`COUNT(e.id)`;
  }
  sql`AS count FROM entities e`;

  if (query?.linksTo) {
    if (published) {
      sql`, entity_published_references er_to, entities e_to`;
    } else {
      sql`, entity_latest_references er_to, entities e_to`;
    }
  }
  if (query?.linksFrom) {
    if (published) {
      sql`, entity_published_references er_from, entities e_from`;
    } else {
      sql`, entity_latest_references er_from, entities e_from`;
    }
  }
  if (query?.componentTypes && query.componentTypes.length > 0) {
    if (published) {
      sql`, entity_published_value_types evt`;
    } else {
      sql`, entity_latest_value_types evt`;
    }
  }
  if (query?.boundingBox) {
    if (published) {
      sql`, entity_published_locations el`;
    } else {
      sql`, entity_latest_locations el`;
    }
  }
  if (query?.text) {
    if (published) {
      sql`, entities_published_fts fts`;
    } else {
      sql`, entities_latest_fts fts`;
    }
  }

  sql`WHERE`;

  const filterResult = addQueryFilters(queryBuilder, schema, query, authKeys, published);
  if (filterResult.isError()) return filterResult;

  return ok(queryBuilder.query);
}

function addEntityQuerySelectColumn(
  { sql }: SqliteQueryBuilder,
  query: PublishedEntitySharedQuery | EntitySharedQuery | undefined,
  published: boolean,
) {
  if (query?.boundingBox) {
    sql`DISTINCT`;
  }
  if (published) {
    sql`e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e`;
  } else {
    sql`e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e`;
  }
  if (query?.linksTo) {
    if (published) {
      sql`, entity_published_references er_to, entities e_to`;
    } else {
      sql`, entity_latest_references er_to, entities e_to`;
    }
  }
  if (query?.linksFrom) {
    if (published) {
      sql`, entities e_from, entity_published_references er_from`;
    } else {
      sql`, entities e_from, entity_latest_references er_from`;
    }
  }
  if (query?.componentTypes && query.componentTypes.length > 0) {
    if (published) {
      sql`, entity_published_value_types evt`;
    } else {
      sql`, entity_latest_value_types evt`;
    }
  }
  if (query?.boundingBox) {
    if (published) {
      sql`, entity_published_locations el`;
    } else {
      sql`, entity_latest_locations el`;
    }
  }
  if (query?.text) {
    if (published) {
      sql`, entities_published_fts fts`;
    } else {
      sql`, entities_latest_fts fts`;
    }
  }
}

function addQueryFilters(
  queryBuilder: SqliteQueryBuilder,
  schema: Schema | PublishedSchema,
  query: PublishedEntitySharedQuery | EntitySharedQuery | undefined,
  authKeys: ResolvedAuthKey[],
  published: boolean,
): Result<void, typeof ErrorType.BadRequest> {
  const { addValueList, sql } = queryBuilder;

  if (published) {
    sql`AND e.published_entity_versions_id IS NOT NULL`;
  }

  // Filter: authKeys
  if (authKeys.length === 0) {
    return notOk.BadRequest('No authKeys provided');
  } else if (authKeys.length === 1) {
    sql`AND e.resolved_auth_key = ${authKeys[0].resolvedAuthKey}`;
  } else {
    sql`AND e.resolved_auth_key IN ${addValueList(authKeys.map((it) => it.resolvedAuthKey))}`;
  }

  // Filter: entityTypes
  const entityTypesResult = getFilterEntityTypes(schema, query);
  if (entityTypesResult.isError()) return entityTypesResult;

  if (entityTypesResult.value.length > 0) {
    sql`AND e.type IN ${addValueList(entityTypesResult.value)}`;
  }

  // Filter: componentTypes
  const componentTypesResult = getFilterComponentTypes(schema, query);
  if (componentTypesResult.isError()) return componentTypesResult;

  if (componentTypesResult.value.length > 0) {
    sql`AND evt.value_type IN ${addValueList(
      componentTypesResult.value,
    )} AND evt.entities_id = e.id`;
  }

  // Filter: status
  if (!published && query && 'status' in query) {
    addFilterStatusSqlSegment(query, queryBuilder);
  }

  // Filter: valid
  if (!published && query && 'valid' in query) {
    // checks both valid and validPublished
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
    sql`AND e.id = el.entities_id AND el.lat >= ${minLat} AND el.lat <= ${maxLat}`;
    if (minLng > 0 && maxLng < 0) {
      // wrapping around 180/-180 boundary
      sql`AND (el.lng <= ${minLng} OR el.lng >= ${maxLng})`;
    } else {
      sql`AND el.lng >= ${minLng} AND el.lng <= ${maxLng}`;
    }
  }

  // Filter: text
  if (query?.text) {
    // fts points to different identical tables based on `published`
    sql`AND fts.content match ${query.text} AND fts.rowid = e.id`;
  }

  return ok(undefined);
}

function getFilterEntityTypes(
  schema: PublishedSchema | Schema,
  query: PublishedEntitySharedQuery | EntitySharedQuery | undefined,
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

function getFilterComponentTypes(
  schema: PublishedSchema | Schema,
  query: PublishedEntitySharedQuery | EntitySharedQuery | undefined,
): Result<string[], typeof ErrorType.BadRequest> {
  if (!query?.componentTypes || query.componentTypes.length === 0) {
    return ok([]);
  }
  for (const componentType of query.componentTypes) {
    if (schema.getComponentTypeSpecification(componentType) === null) {
      return notOk.BadRequest(`Can’t find component type in query: ${componentType}`);
    }
  }
  return ok(query.componentTypes);
}
