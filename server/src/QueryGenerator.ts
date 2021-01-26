import type { AdminQuery, Paging, Result } from '@datadata/core';
import { ErrorType, notOk, ok } from '@datadata/core';
import type { SessionContext } from './';
import type { CursorNativeType } from './Connection';
import type { EntitiesTable } from './DbTableTypes';
import type { AdminEntityValues } from './EntityCodec';
import { resolvePaging } from './Paging';
import QueryBuilder from './QueryBuilder';

export type SearchAdminEntitiesItem = Pick<EntitiesTable, 'id'> & AdminEntityValues;
export function searchAdminEntitiesQuery(
  context: SessionContext,
  query: AdminQuery | undefined,
  paging: Paging | undefined
): Result<
  {
    text: string;
    values: unknown[];
    isForwards: boolean;
    pagingCount: number;
    cursorName: keyof SearchAdminEntitiesItem;
    cursorType: CursorNativeType;
  },
  ErrorType.BadRequest
> {
  let cursorName: keyof SearchAdminEntitiesItem;
  let cursorType: CursorNativeType;
  switch (query?.order) {
    case '_name':
      cursorName = 'name';
      cursorType = 'string';
      break;
    default:
      cursorName = 'id';
      cursorType = 'int';
      break;
  }

  const pagingResult = resolvePaging(cursorType, paging);
  if (pagingResult.isError()) {
    return pagingResult;
  }
  const resolvedPaging = pagingResult.value;

  const qb = new QueryBuilder(`SELECT e.id, e.uuid, e.type, e.name, ev.version, ev.data
  FROM entities e, entity_versions ev`);
  if (query?.referencing) {
    qb.addQuery('entity_version_references evr, entities e2');
  }

  qb.addQuery('WHERE e.latest_draft_entity_versions_id = ev.id');

  // Filter: entityTypes
  const entityTypesResult = getFilterEntityTypes(context, query);
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
  }

  // Paging 1/2
  if (resolvedPaging.after !== null) {
    qb.addQuery(`AND e.${cursorName} > ${qb.addValue(resolvedPaging.after)}`);
  }
  if (resolvedPaging.before !== null) {
    qb.addQuery(`AND e.${cursorName} < ${qb.addValue(resolvedPaging.before)}`);
  }

  // Ordering
  switch (query?.order) {
    case '_name':
      qb.addQuery('ORDER BY e.name');
      break;
    default:
      qb.addQuery('ORDER BY e.id');
      break;
  }

  // Paging 2/2
  const countToRequest = resolvedPaging.count + 1; // request one more to calculate hasNextPage
  qb.addQuery(`${resolvedPaging.isForwards ? '' : 'DESC '}LIMIT ${qb.addValue(countToRequest)}`);

  return ok({
    ...qb.build(),
    isForwards: resolvedPaging.isForwards,
    pagingCount: resolvedPaging.count,
    cursorName,
    cursorType,
  });
}

export function totalAdminEntitiesQuery(
  context: SessionContext,
  query: AdminQuery | undefined
): Result<{ text: string; values: unknown[] }, ErrorType.BadRequest> {
  // Convert count to ::integer since count() is bigint (js doesn't support 64 bit numbers so pg return it as string)
  const qb = new QueryBuilder('SELECT COUNT(e.id)::integer AS count FROM entities e');

  if (query?.referencing) {
    qb.addQuery('entity_versions ev, entity_version_references evr, entities e2');
  }

  qb.addQuery('WHERE');

  // Filter: entityTypes
  const entityTypesResult = getFilterEntityTypes(context, query);
  if (entityTypesResult.isError()) {
    return entityTypesResult;
  }
  if (entityTypesResult.value.length > 0) {
    qb.addQuery(`AND e.type = ANY(${qb.addValue(entityTypesResult.value)})`);
  }

  // Filter: referencing
  if (query?.referencing) {
    qb.addQuery('AND e.latest_draft_entity_versions_id = ev.id');
    qb.addQuery(
      `AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = ${qb.addValue(
        query.referencing
      )}`
    );
  }

  return ok(qb.build());
}

function getFilterEntityTypes(
  context: SessionContext,
  query: AdminQuery | undefined
): Result<string[], ErrorType.BadRequest> {
  if (!query?.entityTypes || query.entityTypes.length === 0) {
    return ok([]);
  }
  const schema = context.server.getSchema();
  for (const entityType of query.entityTypes) {
    if (schema.getEntityTypeSpecification(entityType) === null) {
      return notOk.BadRequest(`Can’t find entity type in query: ${entityType}`);
    }
  }
  return ok(query.entityTypes);
}
