import {
  type Connection,
  type Edge,
  type ErrorType,
  type PagingInfo,
  type Result,
} from '@dossierhq/core';
import type { DatabaseConnectionPayload } from '@dossierhq/database-adapter';
import { resolveConnectionPayload } from '../utils/ConnectionUtils.js';

export function sharedSearchEntities<
  TSchema,
  TSearchResult extends DatabaseConnectionPayload<{ cursor: string }>,
  TEntity,
>(
  schema: TSchema,
  paging: PagingInfo,
  searchResult: TSearchResult,
  hasMoreOppositeDirection: boolean,
  decoder: (
    schema: TSchema,
    values: TSearchResult['edges'][number],
  ) => Result<TEntity, typeof ErrorType.BadRequest | typeof ErrorType.Generic>,
): Result<Connection<Edge<TEntity, ErrorType>> | null, typeof ErrorType.Generic> {
  return resolveConnectionPayload<
    TSearchResult['edges'][number],
    TEntity,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >(paging, searchResult, hasMoreOppositeDirection, (it) => decoder(schema, it));
}
