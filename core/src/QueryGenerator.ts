import type { AdminFilter, Result, SessionContext } from './';
import { ErrorType, notOk, ok } from '.';
import type { ResolvedPaging } from './Paging';
import QueryBuilder from './QueryBuilder';

export function searchAdminEntitiesQuery(
  context: SessionContext,
  filter: undefined | AdminFilter,
  paging: ResolvedPaging
): Result<{ query: string; values: unknown[] }, ErrorType.BadRequest> {
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

  const countToRequest = paging.count + 1; // request one more to calculate hasNextPage
  if (paging.isForwards) {
    if (paging.cursor !== null) {
      qb.addQuery(`AND e.id > ${qb.addValue(paging.cursor)}`);
    }
    qb.addQuery(`ORDER BY e.id LIMIT ${qb.addValue(countToRequest)}`);
  } else {
    if (paging.cursor) {
      qb.addQuery(`AND e.id < ${qb.addValue(paging.cursor)}`);
    }
    qb.addQuery(`ORDER BY e.id DESC LIMIT ${qb.addValue(countToRequest)}`);
  }
  return ok(qb.build());
}
