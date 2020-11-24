import type { ResolvedPaging } from './Paging';
import QueryBuilder from './QueryBuilder';

export function searchAdminEntitiesQuery(
  paging: ResolvedPaging
): { query: string; values: unknown[] } {
  const qb = new QueryBuilder(`SELECT e.id, e.uuid, e.type, e.name, ev.data
  FROM entities e, entity_versions ev
  WHERE e.latest_draft_entity_versions_id = ev.id`);

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
  return qb.build();
}
