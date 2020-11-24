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

  if (filter?.entityTypes && filter.entityTypes.length > 0) {
    const schema = context.instance.getSchema();
    for (const entityType of filter.entityTypes) {
      if (schema.getEntityTypeSpecification(entityType) === null) {
        return notOk.BadRequest(`Can’t find entity type in filter: ${entityType}`);
      }
    }
    qb.addQuery(`AND type = ANY(${qb.addValue(filter.entityTypes)})`);
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
}
