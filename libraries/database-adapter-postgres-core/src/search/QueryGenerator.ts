import type {
  AdminQuery,
  AdminSchema,
  ErrorType,
  Paging,
  PublishedQuery,
  PublishedSchema,
  Result,
} from '@jonasb/datadata-core';
import { AdminQueryOrder, notOk, ok, PublishedQueryOrder } from '@jonasb/datadata-core';
import type { ResolvedAuthKey } from '@jonasb/datadata-database-adapter';
import { PostgresQueryBuilder } from '@jonasb/datadata-database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema';
import type { CursorNativeType } from './OpaqueCursor';
import { toOpaqueCursor } from './OpaqueCursor';
import { resolvePaging } from './Paging';

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
  text: string;
  values: unknown[];
  isForwards: boolean;
  pagingCount: number;
  cursorExtractor: (item: TItem) => string;
}

export function searchPublishedEntitiesQuery(
  schema: PublishedSchema,
  query: PublishedQuery | undefined,
  paging: Paging | undefined,
  authKeys: ResolvedAuthKey[]
): Result<SharedEntitiesQuery<SearchPublishedEntitiesItem>, ErrorType.BadRequest> {
  return sharedSearchEntitiesQuery(schema, query, paging, authKeys, true);
}

export function searchAdminEntitiesQuery(
  schema: AdminSchema,
  query: AdminQuery | undefined,
  paging: Paging | undefined,
  authKeys: ResolvedAuthKey[]
): Result<SharedEntitiesQuery<SearchAdminEntitiesItem>, ErrorType.BadRequest> {
  return sharedSearchEntitiesQuery(schema, query, paging, authKeys, false);
}

function sharedSearchEntitiesQuery<
  TItem extends SearchAdminEntitiesItem | SearchPublishedEntitiesItem
>(
  schema: AdminSchema | PublishedSchema,
  query: PublishedQuery | AdminQuery | undefined,
  paging: Paging | undefined,
  authKeys: ResolvedAuthKey[],
  published: boolean
): Result<SharedEntitiesQuery<TItem>, ErrorType.BadRequest> {
  const { cursorType, cursorName, cursorExtractor } = queryOrderToCursor<TItem>(
    query?.order,
    published
  );

  const pagingResult = resolvePaging(cursorType, paging);
  if (pagingResult.isError()) {
    return pagingResult;
  }
  const resolvedPaging = pagingResult.value;

  const qb = new PostgresQueryBuilder('SELECT');
  if (query?.boundingBox) {
    qb.addQuery('DISTINCT');
  }
  if (published) {
    qb.addQuery(
      'e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev'
    );
  } else {
    qb.addQuery(`e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
  FROM entities e, entity_versions ev`);
  }
  if (query?.referencing) {
    qb.addQuery('entity_version_references evr, entities e2');
  }
  if (query?.boundingBox) {
    qb.addQuery('entity_version_locations evl');
  }

  if (published) {
    qb.addQuery('WHERE e.published_entity_versions_id = ev.id');
  } else {
    qb.addQuery('WHERE e.latest_draft_entity_versions_id = ev.id');
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
  if (entityTypesResult.isError()) {
    return entityTypesResult;
  }
  if (entityTypesResult.value.length > 0) {
    qb.addQuery(`AND e.type = ANY(${qb.addValue(entityTypesResult.value)})`);
  }

  // Filter: status
  if (!published && query && 'status' in query) {
    addFilterStatusSqlSegment(query, qb);
  }

  // Filter: referencing
  if (query?.referencing) {
    qb.addQuery(
      `AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = ${qb.addValue(
        query.referencing
      )}`
    );
    if (published) {
      qb.addQuery('AND e2.published_entity_versions_id IS NOT NULL');
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

  // Paging 1/2
  if (resolvedPaging.after !== null) {
    qb.addQuery(
      `AND e.${cursorName} ${query?.reverse ? '<' : '>'} ${qb.addValue(resolvedPaging.after)}`
    );
  }
  if (resolvedPaging.before !== null) {
    qb.addQuery(
      `AND e.${cursorName} ${query?.reverse ? '>' : '<'} ${qb.addValue(resolvedPaging.before)}`
    );
  }

  // Ordering
  qb.addQuery(`ORDER BY e.${cursorName}`);
  let ascending = !query?.reverse;

  // Paging 2/2
  if (!resolvedPaging.forwards) ascending = !ascending;
  const countToRequest = resolvedPaging.count + 1; // request one more to calculate hasNextPage
  qb.addQuery(`${ascending ? '' : 'DESC '}LIMIT ${qb.addValue(countToRequest)}`);

  return ok({
    ...qb.build(),
    isForwards: resolvedPaging.forwards,
    pagingCount: resolvedPaging.count,
    cursorExtractor,
  });
}

function queryOrderToCursor<TItem extends SearchAdminEntitiesItem | SearchPublishedEntitiesItem>(
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
          cursorExtractor: (item: TItem) => toOpaqueCursor(cursorType, item[cursorName]),
        };
      }
      case PublishedQueryOrder.createdAt:
      default: {
        const cursorType = 'int';
        const cursorName = 'id';
        return {
          cursorType,
          cursorName,
          cursorExtractor: (item: TItem) => toOpaqueCursor(cursorType, item[cursorName]),
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
        cursorExtractor: (item: TItem) => toOpaqueCursor(cursorType, item[cursorName]),
      };
    }
    case AdminQueryOrder.updatedAt: {
      const cursorType = 'int';
      const cursorName = 'updated';
      return {
        cursorType,
        cursorName,
        cursorExtractor: (item: TItem) =>
          toOpaqueCursor(cursorType, (item as SearchAdminEntitiesItem)[cursorName]),
      };
    }
    case AdminQueryOrder.createdAt:
    default: {
      const cursorType = 'int';
      const cursorName = 'id';
      return {
        cursorType,
        cursorName,
        cursorExtractor: (item: TItem) => toOpaqueCursor(cursorType, item[cursorName]),
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

export function totalAdminEntitiesQuery(
  schema: AdminSchema,
  authKeys: ResolvedAuthKey[],
  query: AdminQuery | undefined
): Result<{ text: string; values: unknown[] }, ErrorType.BadRequest> {
  return totalCountQuery(schema, authKeys, query, false);
}

export function totalPublishedEntitiesQuery(
  schema: PublishedSchema,
  authKeys: ResolvedAuthKey[],
  query: PublishedQuery | undefined
): Result<{ text: string; values: unknown[] }, ErrorType.BadRequest> {
  return totalCountQuery(schema, authKeys, query, true);
}

function totalCountQuery(
  schema: AdminSchema | PublishedSchema,
  authKeys: ResolvedAuthKey[],
  query: AdminQuery | PublishedQuery | undefined,
  published: boolean
): Result<{ text: string; values: unknown[] }, ErrorType.BadRequest> {
  const qb = new PostgresQueryBuilder('SELECT');
  // Convert count to ::integer since count() is bigint (js doesn't support 64 bit numbers so pg return it as string)
  if (query?.boundingBox) {
    qb.addQuery('COUNT(DISTINCT e.id)::integer');
  } else {
    qb.addQuery('COUNT(e.id)::integer');
  }
  qb.addQuery('AS count FROM entities e');

  if (query?.referencing || query?.boundingBox) {
    qb.addQuery('entity_versions ev');
  }
  if (query?.referencing) {
    qb.addQuery('entity_version_references evr, entities e2');
  }
  if (query?.boundingBox) {
    qb.addQuery('entity_version_locations evl');
  }

  qb.addQuery('WHERE');

  if (published) {
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
  if (entityTypesResult.isError()) {
    return entityTypesResult;
  }
  if (entityTypesResult.value.length > 0) {
    qb.addQuery(`AND e.type = ANY(${qb.addValue(entityTypesResult.value)})`);
  }

  // Filter: status
  if (!published && query && 'status' in query) {
    addFilterStatusSqlSegment(query, qb);
  }

  if (query?.referencing || query?.boundingBox) {
    if (published) {
      qb.addQuery('AND e.published_entity_versions_id = ev.id');
    } else {
      qb.addQuery('AND e.latest_draft_entity_versions_id = ev.id');
    }
  }

  // Filter: referencing
  if (query?.referencing) {
    qb.addQuery(
      `AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = ${qb.addValue(
        query.referencing
      )}`
    );
    if (published) {
      qb.addQuery('AND e2.published_entity_versions_id IS NOT NULL');
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

  return ok(qb.build());
}

function getFilterEntityTypes(
  schema: PublishedSchema | AdminSchema,
  query: PublishedQuery | AdminQuery | undefined
): Result<string[], ErrorType.BadRequest> {
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
