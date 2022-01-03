import type { Connection, Edge, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdminEntitySearchPayload,
  DatabasePublishedEntitySearchPayload,
} from '@jonasb/datadata-database-adapter';

export async function sharedSearchEntities<
  TSchema,
  TSearchResult extends DatabaseAdminEntitySearchPayload | DatabasePublishedEntitySearchPayload,
  TEntity
>(
  schema: TSchema,
  searchResult: TSearchResult,
  decoder: (schema: TSchema, values: TSearchResult['entities'][0]) => TEntity
): PromiseResult<Connection<Edge<TEntity, ErrorType>> | null, ErrorType.BadRequest> {
  const entities = searchResult.entities.map((it) => decoder(schema, it));
  if (entities.length === 0) {
    return ok(null);
  }

  return ok({
    pageInfo: {
      hasNextPage: searchResult.hasNextPage,
      hasPreviousPage: searchResult.hasPreviousPage,
      startCursor: searchResult.entities[0].cursor,
      endCursor: searchResult.entities[searchResult.entities.length - 1].cursor,
    },
    edges: entities.map((entity, index) => ({
      cursor: searchResult.entities[index].cursor,
      node: ok(entity),
    })),
  });
}
