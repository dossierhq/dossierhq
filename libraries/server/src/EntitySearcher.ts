import type { Connection, Edge, ErrorType, PromiseResult, Schema } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter, SessionContext } from '.';
import { toOpaqueCursor } from './Connection';
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
  schema: Schema,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  sqlQuery: SharedEntitiesQuery,
  decoder: (schema: Schema, rowValues: TDbItem) => TEntity
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

  const { cursorName, cursorType } = sqlQuery;
  return ok({
    pageInfo: {
      hasNextPage: sqlQuery.isForwards ? hasExtraPage : false,
      hasPreviousPage: sqlQuery.isForwards ? false : hasExtraPage,
      startCursor: toOpaqueCursor(cursorType, entitiesValues[0][cursorName]),
      endCursor: toOpaqueCursor(cursorType, entitiesValues[entitiesValues.length - 1][cursorName]),
    },
    edges: entities.map((entity, index) => ({
      cursor: toOpaqueCursor(cursorType, entitiesValues[index][cursorName]),
      node: ok(entity),
    })),
  });
}
