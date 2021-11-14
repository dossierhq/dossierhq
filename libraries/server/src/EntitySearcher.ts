import type {
  Connection,
  Edge,
  ErrorType,
  PromiseResult,
  AdminSchema,
} from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter, SessionContext } from '.';
import { queryMany } from './Database';
import type {
  SearchAdminEntitiesItem,
  SearchPublishedEntitiesItem,
  SharedEntitiesQuery,
} from './QueryGenerator';

export async function sharedSearchEntities<
  TEntity,
  TDbItem extends SearchAdminEntitiesItem | SearchPublishedEntitiesItem
>(
  schema: AdminSchema,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  sqlQuery: SharedEntitiesQuery<TDbItem>,
  decoder: (schema: AdminSchema, rowValues: TDbItem) => TEntity
): PromiseResult<Connection<Edge<TEntity, ErrorType>> | null, ErrorType.BadRequest> {
  const entitiesValues = await queryMany<TDbItem>(databaseAdapter, context, sqlQuery);
  const hasExtraPage = entitiesValues.length > sqlQuery.pagingCount;
  if (hasExtraPage) {
    entitiesValues.splice(sqlQuery.pagingCount, 1);
  }

  if (!sqlQuery.isForwards) {
    // Reverse since DESC order returns the rows in the wrong order, we want them in the same order as for forwards pagination
    entitiesValues.reverse();
  }

  const entities = entitiesValues.map((it) => decoder(schema, it));
  if (entities.length === 0) {
    return ok(null);
  }

  const { cursorExtractor } = sqlQuery;
  return ok({
    pageInfo: {
      hasNextPage: sqlQuery.isForwards ? hasExtraPage : false,
      hasPreviousPage: sqlQuery.isForwards ? false : hasExtraPage,
      startCursor: cursorExtractor(entitiesValues[0]),
      endCursor: cursorExtractor(entitiesValues[entitiesValues.length - 1]),
    },
    edges: entities.map((entity, index) => ({
      cursor: cursorExtractor(entitiesValues[index]),
      node: ok(entity),
    })),
  });
}
