import type { AdminFilter, Paging, Result, SessionContext } from './';
import { ErrorType, notOk, ok } from '.';
import { resolvePaging } from './Paging';
import QueryBuilder from './QueryBuilder';

export function searchAdminEntitiesQuery(
  context: SessionContext,
  filter: AdminFilter | undefined,
  paging: Paging | undefined
): Result<
  { query: string; values: unknown[]; isForwards: boolean; pagingCount: number },
  ErrorType.BadRequest
> {
  const pagingResult = resolvePaging(paging);
  if (pagingResult.isError()) {
    return pagingResult;
  }
  const resolvedPaging = pagingResult.value;

  const qb = new QueryBuilder(`SELECT e.id, e.uuid, e.type, e.name, ev.data
  FROM entities e, entity_versions ev
  WHERE e.latest_draft_entity_versions_id = ev.id`);

  // Filter: entityTypes
  const entityTypesResult = getFilterEntityTypes(context, filter);
  if (entityTypesResult.isError()) {
    return entityTypesResult;
  }
  if (entityTypesResult.value.length > 0) {
    qb.addQuery(`AND type = ANY(${qb.addValue(entityTypesResult.value)})`);
  }

  if (resolvedPaging.after !== null) {
    qb.addQuery(`AND e.id > ${qb.addValue(resolvedPaging.after)}`);
  }
  if (resolvedPaging.before !== null) {
    qb.addQuery(`AND e.id < ${qb.addValue(resolvedPaging.before)}`);
  }

  const countToRequest = resolvedPaging.count + 1; // request one more to calculate hasNextPage
  if (resolvedPaging.isForwards) {
    qb.addQuery(`ORDER BY e.id LIMIT ${qb.addValue(countToRequest)}`);
  } else {
    qb.addQuery(`ORDER BY e.id DESC LIMIT ${qb.addValue(countToRequest)}`);
  }
  return ok({
    ...qb.build(),
    isForwards: resolvedPaging.isForwards,
    pagingCount: resolvedPaging.count,
  });
}

export function totalAdminEntitiesQuery(
  context: SessionContext,
  filter: AdminFilter | undefined
): Result<{ query: string; values: unknown[] }, ErrorType.BadRequest> {
  // Convert count to ::integer since count() is bigint (js doesn't support 64 bit numbers so pg return it as string)
  const qb = new QueryBuilder('SELECT COUNT(e.id)::integer AS count FROM entities e WHERE');

  // Filter: entityTypes
  const entityTypesResult = getFilterEntityTypes(context, filter);
  if (entityTypesResult.isError()) {
    return entityTypesResult;
  }
  if (entityTypesResult.value.length > 0) {
    qb.addQuery(`AND type = ANY(${qb.addValue(entityTypesResult.value)})`);
  }

  return ok(qb.build());
}

function getFilterEntityTypes(
  context: SessionContext,
  filter: AdminFilter | undefined
): Result<string[], ErrorType.BadRequest> {
  if (!filter?.entityTypes || filter.entityTypes.length === 0) {
    return ok([]);
  }
  const schema = context.instance.getSchema();
  for (const entityType of filter.entityTypes) {
    if (schema.getEntityTypeSpecification(entityType) === null) {
      return notOk.BadRequest(`Can’t find entity type in filter: ${entityType}`);
    }
  }
  return ok(filter.entityTypes);
}
