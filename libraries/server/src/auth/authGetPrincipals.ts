import {
  ok,
  type Connection,
  type Edge,
  type ErrorType,
  type Paging,
  type PromiseResult,
} from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabaseAuthSyncPrincipal,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { SyncPrincipal } from '../Server.js';
import { fetchAndDecodeConnection } from '../utils/fetchAndDecodeConnection.js';

export function autGetPrincipals(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  paging: Paging | undefined,
): PromiseResult<
  Connection<Edge<SyncPrincipal, typeof ErrorType.Generic>> | null,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  return fetchAndDecodeConnection(
    paging,
    (pagingInfo) => databaseAdapter.authGetPrincipals(context, pagingInfo),
    ({
      cursor,
      ...principal
    }: DatabaseAuthSyncPrincipal & {
      cursor: string;
    }) => ok(principal),
  );
}
