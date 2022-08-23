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
import { AdminQueryOrder, notOk, ok, PublishedQueryOrder } from '@jonasb/datadata-core';
import type { DatabasePagingInfo, ResolvedAuthKey } from '@jonasb/datadata-database-adapter';
import { SqliteQueryBuilder } from '@jonasb/datadata-database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import type { ColumnValue } from '../SqliteDatabaseAdapter.js';
import type { CursorNativeType } from './OpaqueCursor.js';
import { toOpaqueCursor } from './OpaqueCursor.js';
import { resolvePagingCursors } from './Paging.js';

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
> &
  Pick<EntityVersionsTable, 'version' | 'fields'>;
export type SearchPublishedEntitiesItem = Pick<
  EntitiesTable,
  'id' | 'uuid' | 'type' | 'name' | 'auth_key' | 'created_at'
> &
  Pick<EntityVersionsTable, 'fields'>;

type CursorName = 'name' | 'updated_seq' | 'id';

export interface SharedEntitiesQuery<TItem> {
  sqlQuery: { text: string; values: ColumnValue[] };
  cursorExtractor: (item: TItem) => string;
}

export function searchPublishedEntitiesQuery(
  database: Database,
  schema: PublishedSchema,
  query: PublishedSearchQuery | undefined,
  paging: DatabasePagingInfo,
  authKeys: ResolvedAuthKey[]
): Result<SharedEntitiesQuery<SearchPublishedEntitiesItem>, typeof ErrorType.BadRequest> {
  return sharedSearchEntitiesQuery(database, schema, query, paging, authKeys, true);
}

export function searchAdminEntitiesQuery(
  database: Database,
  schema: AdminSchema,
  query: AdminSearchQuery | undefined,
  paging: DatabasePagingInfo,
  authKeys: ResolvedAuthKey[]
): Result<SharedEntitiesQuery<SearchAdminEntitiesItem>, typeof ErrorType.BadRequest> {
  return sharedSearchEntitiesQuery(database, schema, query, paging, authKeys, false);
}

function sharedSearchEntitiesQuery<
  TItem extends SearchAdminEntitiesItem | SearchPublishedEntitiesItem
>(
  database: Database,
  schema: AdminSchema | PublishedSchema,
  query: PublishedSearchQuery | AdminSearchQuery | undefined,
  paging: DatabasePagingInfo,
  authKeys: ResolvedAuthKey[],
  published: boolean
): Result<SharedEntitiesQuery<TItem>, typeof ErrorType.BadRequest> {
  const { cursorType, cursorName, cursorExtractor } = queryOrderToCursor<TItem>(
    database,
    query?.order,
    published
  );

  const cursorsResult = resolvePagingCursors(database, cursorType, paging);
  if (cursorsResult.isError()) return cursorsResult;
  const resolvedCursors = cursorsResult.value;

  const qb = new SqliteQueryBuilder('SELECT');
  addEntityQuerySelectColumn(qb, query, published);

  qb.addQuery('WHERE');

  const filterResult = addQueryFilters(qb, schema, query, authKeys, published, true);
  if (filterResult.isError()) return filterResult;

  // Paging 1/2
  if (resolvedCursors.after !== null) {
    let operator = query?.reverse ? '<' : '>';
    if (paging.afterInclusive) operator += '=';
    qb.addQuery(`AND e.${cursorName} ${operator} ${qb.addValue(resolvedCursors.after as string)}`);
  }
  if (resolvedCursors.before !== null) {
    let operator = query?.reverse ? '>' : '<';
    if (paging.beforeInclusive) operator += '=';
    qb.addQuery(`AND e.${cursorName} ${operator} ${qb.addValue(resolvedCursors.before as string)}`);
  }

  // Ordering
  qb.addQuery(`ORDER BY e.${cursorName}`);
  let ascending = !query?.reverse;

  // Paging 2/2
  if (!paging.forwards) ascending = !ascending;
  const countToRequest = paging.count + 1; // request one more to calculate hasMore
  qb.addQuery(`${ascending ? '' : 'DESC '}LIMIT ${qb.addValue(countToRequest)}`);

  return ok({
    sqlQuery: qb.build(),
    cursorExtractor,
  });
}

function queryOrderToCursor<TItem extends SearchAdminEntitiesItem | SearchPublishedEntitiesItem>(
  database: Database,
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
          cursorExtractor: (item: TItem) => toOpaqueCursor(database, cursorType, item[cursorName]),
        };
      }
      case PublishedQueryOrder.createdAt:
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
    case AdminQueryOrder.name: {
      const cursorType = 'string';
      const cursorName = 'name';
      return {
        cursorType,
        cursorName,
        cursorExtractor: (item: TItem) => toOpaqueCursor(database, cursorType, item[cursorName]),
      };
    }
    case AdminQueryOrder.updatedAt: {
      const cursorType = 'int';
      const cursorName = 'updated_seq';
      return {
        cursorType,
        cursorName,
        cursorExtractor: (item: TItem) =>
          toOpaqueCursor(database, cursorType, (item as SearchAdminEntitiesItem)[cursorName]),
      };
    }
    case AdminQueryOrder.createdAt:
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

function addFilterStatusSqlSegment(query: AdminQuery, qb: SqliteQueryBuilder) {
  if (!query.status || query.status.length === 0) {
    return;
  }
  if (query.status.length === 1) {
    qb.addQuery(`AND status = ${qb.addValue(query.status[0])}`);
  } else {
    qb.addQuery(`AND status IN ${qb.addValueList(query.status)}`);
  }
}

export function sampleAdminEntitiesQuery(
  schema: AdminSchema,
  query: AdminQuery | undefined,
  offset: number,
  limit: number,
  authKeys: ResolvedAuthKey[]
): Result<{ text: string; values: ColumnValue[] }, typeof ErrorType.BadRequest> {
  return sampleEntitiesQuery(schema, query, offset, limit, authKeys, false);
}

export function samplePublishedEntitiesQuery(
  schema: PublishedSchema,
  query: PublishedQuery | undefined,
  offset: number,
  limit: number,
  authKeys: ResolvedAuthKey[]
): Result<{ text: string; values: ColumnValue[] }, typeof ErrorType.BadRequest> {
  return sampleEntitiesQuery(schema, query, offset, limit, authKeys, true);
}

function sampleEntitiesQuery(
  schema: AdminSchema | PublishedSchema,
  query: AdminQuery | PublishedQuery | undefined,
  offset: number,
  limit: number,
  authKeys: ResolvedAuthKey[],
  published: boolean
): Result<{ text: string; values: ColumnValue[] }, typeof ErrorType.BadRequest> {
  const qb = new SqliteQueryBuilder('SELECT');

  addEntityQuerySelectColumn(qb, query, published);

  qb.addQuery('WHERE');

  const filterResult = addQueryFilters(qb, schema, query, authKeys, published, true);
  if (filterResult.isError()) return filterResult;

  qb.addQuery(`ORDER BY e.uuid LIMIT ${qb.addValue(limit)} OFFSET ${qb.addValue(offset)}`);

  return ok(qb.build());
}

export function totalAdminEntitiesQuery(
  schema: AdminSchema,
  authKeys: ResolvedAuthKey[],
  query: AdminQuery | undefined
): Result<{ text: string; values: ColumnValue[] }, typeof ErrorType.BadRequest> {
  return totalCountQuery(schema, authKeys, query, false);
}

export function totalPublishedEntitiesQuery(
  schema: PublishedSchema,
  authKeys: ResolvedAuthKey[],
  query: PublishedQuery | undefined
): Result<{ text: string; values: ColumnValue[] }, typeof ErrorType.BadRequest> {
  return totalCountQuery(schema, authKeys, query, true);
}

function totalCountQuery(
  schema: AdminSchema | PublishedSchema,
  authKeys: ResolvedAuthKey[],
  query: AdminQuery | PublishedQuery | undefined,
  published: boolean
): Result<{ text: string; values: ColumnValue[] }, typeof ErrorType.BadRequest> {
  const qb = new SqliteQueryBuilder('SELECT');
  if (query?.boundingBox) {
    qb.addQuery('COUNT(DISTINCT e.id)');
  } else {
    qb.addQuery('COUNT(e.id)');
  }
  qb.addQuery('AS count FROM entities e');

  const linkToEntityVersion = !!query?.boundingBox;

  if (linkToEntityVersion) {
    qb.addQuery('entity_versions ev');
  }
  if (query?.linksTo) {
    qb.addQuery(
      published
        ? 'entity_published_references er_to, entities e_to'
        : 'entity_latest_references er_to, entities e_to'
    );
  }
  if (query?.linksFrom) {
    qb.addQuery(
      published
        ? 'entity_published_references er_from, entities e_from'
        : 'entity_latest_references er_from, entities e_from'
    );
  }
  if (query?.boundingBox) {
    qb.addQuery('entity_version_locations evl');
  }
  if (query?.text) {
    qb.addQuery(published ? 'entities_published_fts fts' : 'entities_latest_fts fts');
  }

  qb.addQuery('WHERE');

  const filterResult = addQueryFilters(qb, schema, query, authKeys, published, linkToEntityVersion);
  if (filterResult.isError()) return filterResult;

  return ok(qb.build());
}

function addEntityQuerySelectColumn(
  qb: SqliteQueryBuilder,
  query: PublishedQuery | AdminQuery | undefined,
  published: boolean
) {
  if (query?.boundingBox) {
    qb.addQuery('DISTINCT');
  }
  if (published) {
    qb.addQuery(
      'e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev'
    );
  } else {
    qb.addQuery(`e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
  FROM entities e, entity_versions ev`);
  }
  if (query?.linksTo) {
    qb.addQuery(
      published
        ? 'entity_published_references er_to, entities e_to'
        : 'entity_latest_references er_to, entities e_to'
    );
  }
  if (query?.linksFrom) {
    qb.addQuery(
      published
        ? 'entities e_from, entity_published_references er_from'
        : 'entities e_from, entity_latest_references er_from'
    );
  }
  if (query?.boundingBox) {
    qb.addQuery('entity_version_locations evl');
  }
  if (query?.text) {
    qb.addQuery(published ? 'entities_published_fts fts' : 'entities_latest_fts fts');
  }
}

function addQueryFilters(
  qb: SqliteQueryBuilder,
  schema: AdminSchema | PublishedSchema,
  query: PublishedQuery | AdminQuery | undefined,
  authKeys: ResolvedAuthKey[],
  published: boolean,
  linkToEntityVersion: boolean
): Result<void, typeof ErrorType.BadRequest> {
  if (linkToEntityVersion) {
    if (published) {
      qb.addQuery('AND e.published_entity_versions_id = ev.id');
    } else {
      qb.addQuery('AND e.latest_entity_versions_id = ev.id');
    }
  } else if (published) {
    qb.addQuery('AND e.published_entity_versions_id IS NOT NULL');
  }

  // Filter: authKeys
  if (authKeys.length === 0) {
    return notOk.BadRequest('No authKeys provided');
  } else if (authKeys.length === 1) {
    qb.addQuery(`AND e.resolved_auth_key = ${qb.addValue(authKeys[0].resolvedAuthKey)}`);
  } else {
    qb.addQuery(
      `AND e.resolved_auth_key IN ${qb.addValueList(authKeys.map((it) => it.resolvedAuthKey))}`
    );
  }

  // Filter: entityTypes
  const entityTypesResult = getFilterEntityTypes(schema, query);
  if (entityTypesResult.isError()) {
    return entityTypesResult;
  }
  if (entityTypesResult.value.length > 0) {
    qb.addQuery(`AND e.type IN ${qb.addValueList(entityTypesResult.value)}`);
  }

  // Filter: status
  if (!published && query && 'status' in query) {
    addFilterStatusSqlSegment(query, qb);
  }

  // Filter: linksTo
  if (query?.linksTo) {
    qb.addQuery(
      `AND e.id = er_to.from_entities_id AND er_to.to_entities_id = e_to.id AND e_to.uuid = ${qb.addValue(
        query.linksTo.id
      )}`
    );
  }

  // Filter: linksFrom
  if (query?.linksFrom) {
    qb.addQuery(`AND e_from.uuid = ${qb.addValue(query.linksFrom.id)}`);
    qb.addQuery(`AND e_from.id = er_from.from_entities_id AND er_from.to_entities_id = e.id`);
  }

  // Filter: bounding box
  if (query?.boundingBox) {
    const { minLat, maxLat, minLng, maxLng } = query.boundingBox;
    qb.addQuery(
      `AND ev.id = evl.entity_versions_id AND evl.lat >= ${qb.addValue(
        minLat
      )} AND evl.lat <= ${qb.addValue(maxLat)}`
    );
    if (minLng > 0 && maxLng < 0) {
      // wrapping around 180/-180 boundary
      qb.addQuery(`AND (evl.lng <= ${qb.addValue(minLng)} OR evl.lng >= ${qb.addValue(maxLng)})`);
    } else {
      qb.addQuery(`AND evl.lng >= ${qb.addValue(minLng)} AND evl.lng <= ${qb.addValue(maxLng)}`);
    }
  }

  // Filter: text
  if (query?.text) {
    // fts points to different identical tables based on `published`
    qb.addQuery(`AND fts.content match ${qb.addValue(query.text)} AND fts.docid = e.id`);
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
