import type { AdminQuery, ErrorType, Paging, Query, Result, Schema } from '@jonasb/datadata-core';
import { AdminQueryOrder, notOk, ok, QueryOrder } from '@jonasb/datadata-core';
import type { CursorNativeType } from './Connection';
import { toOpaqueCursor } from './Connection';
import type { EntitiesTable } from './DatabaseTables';
import type { AdminEntityValues, EntityValues } from './EntityCodec';
import { resolvePaging } from './Paging';
import QueryBuilder from './QueryBuilder';

export type SearchAdminEntitiesItem = Pick<EntitiesTable, 'id' | 'updated'> & AdminEntityValues;
export type SearchPublishedEntitiesItem = Pick<EntitiesTable, 'id'> & EntityValues;

type CursorName = 'name' | 'updated' | 'id';

export interface SharedEntitiesQuery<TItem> {
  text: string;
  values: unknown[];
  isForwards: boolean;
  pagingCount: number;
  cursorExtractor: (item: TItem) => string;
}

export function searchPublishedEntitiesQuery(
  schema: Schema,
  query: Query | undefined,
  paging: Paging | undefined
): Result<SharedEntitiesQuery<SearchPublishedEntitiesItem>, ErrorType.BadRequest> {
  return sharedSearchEntitiesQuery(schema, query, paging, true);
}

export function searchAdminEntitiesQuery(
  schema: Schema,
  query: AdminQuery | undefined,
  paging: Paging | undefined
): Result<SharedEntitiesQuery<SearchAdminEntitiesItem>, ErrorType.BadRequest> {
  return sharedSearchEntitiesQuery(schema, query, paging, false);
}

function sharedSearchEntitiesQuery<
  TItem extends SearchAdminEntitiesItem | SearchPublishedEntitiesItem
>(
  schema: Schema,
  query: Query | AdminQuery | undefined,
  paging: Paging | undefined,
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

  const qb = new QueryBuilder('SELECT');
  if (query?.boundingBox) {
    qb.addQuery('DISTINCT');
  }
  if (published) {
    qb.addQuery('e.id, e.uuid, e.type, e.name, ev.data FROM entities e, entity_versions ev');
  } else {
    qb.addQuery(`e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
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

  // Filter: entityTypes
  const entityTypesResult = getFilterEntityTypes(schema, query);
  if (entityTypesResult.isError()) {
    return entityTypesResult;
  }
  if (entityTypesResult.value.length > 0) {
    qb.addQuery(`AND e.type = ANY(${qb.addValue(entityTypesResult.value)})`);
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
    qb.addQuery(`AND e.${cursorName} > ${qb.addValue(resolvedPaging.after)}`);
  }
  if (resolvedPaging.before !== null) {
    qb.addQuery(`AND e.${cursorName} < ${qb.addValue(resolvedPaging.before)}`);
  }

  // Ordering
  qb.addQuery(`ORDER BY e.${cursorName}`);

  // Paging 2/2
  const countToRequest = resolvedPaging.count + 1; // request one more to calculate hasNextPage
  qb.addQuery(`${resolvedPaging.forwards ? '' : 'DESC '}LIMIT ${qb.addValue(countToRequest)}`);

  return ok({
    ...qb.build(),
    isForwards: resolvedPaging.forwards,
    pagingCount: resolvedPaging.count,
    cursorExtractor,
  });
}

function queryOrderToCursor<TItem extends SearchAdminEntitiesItem | SearchPublishedEntitiesItem>(
  order: QueryOrder | AdminQueryOrder | undefined,
  published: boolean
): {
  cursorName: CursorName;
  cursorType: CursorNativeType;
  cursorExtractor: (item: TItem) => string;
} {
  if (published) {
    switch (order) {
      case QueryOrder.name: {
        const cursorType = 'string';
        const cursorName = 'name';
        return {
          cursorType,
          cursorName,
          cursorExtractor: (item: TItem) => toOpaqueCursor(cursorType, item[cursorName]),
        };
      }
      case QueryOrder.createdAt:
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

export function totalAdminEntitiesQuery(
  schema: Schema,
  query: AdminQuery | undefined
): Result<{ text: string; values: unknown[] }, ErrorType.BadRequest> {
  const qb = new QueryBuilder('SELECT');
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

  // Filter: entityTypes
  const entityTypesResult = getFilterEntityTypes(schema, query);
  if (entityTypesResult.isError()) {
    return entityTypesResult;
  }
  if (entityTypesResult.value.length > 0) {
    qb.addQuery(`AND e.type = ANY(${qb.addValue(entityTypesResult.value)})`);
  }

  if (query?.referencing || query?.boundingBox) {
    qb.addQuery('AND e.latest_draft_entity_versions_id = ev.id');
  }

  // Filter: referencing
  if (query?.referencing) {
    qb.addQuery(
      `AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = ${qb.addValue(
        query.referencing
      )}`
    );
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
    qb.addQuery(`AND e.latest_fts @@ websearch_to_tsquery(${qb.addValue(query.text)})`);
  }

  return ok(qb.build());
}

function getFilterEntityTypes(
  schema: Schema,
  query: Query | AdminQuery | undefined
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
