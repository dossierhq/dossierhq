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
import { PostgresQueryBuilder } from '@jonasb/datadata-database-adapter';
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

  const qb = new PostgresQueryBuilder('SELECT');
  addEntityQuerySelectColumn(qb, query, published);

  qb.addQuery('WHERE');

  const filterResult = addQueryFilters(qb, schema, query, authKeys, published, true);
  if (filterResult.isError()) return filterResult;

  // Paging 1/2
  if (resolvedCursors.after !== null) {
    let operator = query?.reverse ? '<' : '>';
    if (paging.afterInclusive) operator += '=';
    qb.addQuery(`AND e.${cursorName} ${operator} ${qb.addValue(resolvedCursors.after)}`);
  }
  if (resolvedCursors.before !== null) {
    let operator = query?.reverse ? '>' : '<';
    if (paging.beforeInclusive) operator += '=';
    qb.addQuery(`AND e.${cursorName} ${operator} ${qb.addValue(resolvedCursors.before)}`);
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

function addFilterStatusSqlSegment(query: AdminQuery, qb: PostgresQueryBuilder) {
  if (!query.status || query.status.length === 0) {
    return;
  }
  if (query.status.length === 1) {
    qb.addQuery(`AND status = ${qb.addValue(query.status[0])}`);
  } else {
    qb.addQuery(`AND status = ANY(${qb.addValue(query.status)})`);
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
  const qb = new PostgresQueryBuilder('SELECT');

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
  const qb = new PostgresQueryBuilder('SELECT');
  // Convert count to ::integer since count() is bigint (js doesn't support 64 bit numbers so pg return it as string)
  if (query?.boundingBox) {
    qb.addQuery('COUNT(DISTINCT e.id)::integer');
  } else {
    qb.addQuery('COUNT(e.id)::integer');
  }
  qb.addQuery('AS count FROM entities e');

  const linkToEntityVersion = !!((!published && query?.linksTo) || query?.boundingBox);

  if (linkToEntityVersion) {
    qb.addQuery('entity_versions ev');
  }
  if (query?.linksTo) {
    if (published) {
      qb.addQuery('entity_published_references epr_to, entities e_to');
    } else {
      qb.addQuery('entity_version_references evr, entities e2');
    }
  }
  if (query?.linksFrom) {
    if (published) {
      qb.addQuery('entity_published_references epr_from, entities e_from');
    } else {
      qb.addQuery('entities e_from, entity_version_references evr_from');
    }
  }
  if (query?.boundingBox) {
    qb.addQuery('entity_version_locations evl');
  }

  qb.addQuery('WHERE');

  const filterResult = addQueryFilters(qb, schema, query, authKeys, published, linkToEntityVersion);
  if (filterResult.isError()) return filterResult;

  return ok(qb.build());
}

function addEntityQuerySelectColumn(
  qb: PostgresQueryBuilder,
  query: PublishedQuery | AdminQuery | undefined,
  published: boolean
) {
  if (query?.boundingBox) {
    qb.addQuery('DISTINCT');
  }
  // TODO could skip some columns depending on sample/search and sort order
  if (published) {
    qb.addQuery(
      'e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev'
    );
  } else {
    qb.addQuery(
      `e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
  FROM entities e, entity_versions ev`
    );
  }
  if (query?.linksTo) {
    if (published) {
      qb.addQuery('entity_published_references epr_to, entities e_to');
    } else {
      qb.addQuery('entity_version_references evr, entities e2');
    }
  }
  if (query?.linksFrom) {
    if (published) {
      qb.addQuery('entities e_from, entity_published_references epr_from');
    } else {
      qb.addQuery('entities e_from, entity_version_references evr_from');
    }
  }
  if (query?.boundingBox) {
    qb.addQuery('entity_version_locations evl');
  }
}

function addQueryFilters(
  qb: PostgresQueryBuilder,
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
      qb.addQuery('AND e.latest_draft_entity_versions_id = ev.id');
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
      `AND e.resolved_auth_key = ANY(${qb.addValue(authKeys.map((it) => it.resolvedAuthKey))})`
    );
  }

  // Filter: entityTypes
  const entityTypesResult = getFilterEntityTypes(schema, query);
  if (entityTypesResult.isError()) return entityTypesResult;
  if (entityTypesResult.value.length > 0) {
    qb.addQuery(`AND e.type = ANY(${qb.addValue(entityTypesResult.value)})`);
  }

  // Filter: status
  if (!published && query && 'status' in query) {
    addFilterStatusSqlSegment(query, qb);
  }

  // Filter: linksTo
  if (query?.linksTo) {
    if (published) {
      qb.addQuery(
        `AND e.id = epr_to.from_entities_id AND epr_to.to_entities_id = e_to.id AND e_to.uuid = ${qb.addValue(
          query.linksTo.id
        )}`
      );
    } else {
      qb.addQuery(
        `AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = ${qb.addValue(
          query.linksTo.id
        )}`
      );
    }
  }

  // Filter: linksFrom
  if (query?.linksFrom) {
    qb.addQuery(`AND e_from.uuid = ${qb.addValue(query.linksFrom.id)}`);
    if (published) {
      qb.addQuery(`AND e_from.id = epr_from.from_entities_id AND epr_from.to_entities_id = e.id`);
    } else {
      qb.addQuery('AND e_from.latest_draft_entity_versions_id = evr_from.entity_versions_id');
      qb.addQuery('AND evr_from.entities_id = e.id');
    }
  }

  // Filter: bounding box
  if (query?.boundingBox) {
    const { minLat, maxLat, minLng, maxLng } = query.boundingBox;
    qb.addQuery(
      `AND ev.id = evl.entity_versions_id AND evl.location && ST_MakeEnvelope(${qb.addValue(
        minLng
      )}, ${qb.addValue(minLat)}, ${qb.addValue(maxLng)}, ${qb.addValue(maxLat)}, 4326)`
    );
  }

  // Filter: text
  if (query?.text) {
    if (published) {
      qb.addQuery(`AND e.published_fts @@ websearch_to_tsquery(${qb.addValue(query.text)})`);
    } else {
      qb.addQuery(`AND e.latest_fts @@ websearch_to_tsquery(${qb.addValue(query.text)})`);
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
