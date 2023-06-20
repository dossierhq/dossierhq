import type { ErrorType, PromiseResult } from '@dossierhq/core';
import {
  createPostgresSqlQuery,
  type DatabaseResolvedEntityReference,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNone } from '../QueryFunctions.js';

export async function managementDirtyUpdateEntity(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  reference: DatabaseResolvedEntityReference,
  valid: boolean,
  validPublished: boolean | null
): PromiseResult<void, typeof ErrorType.Generic> {
  const invalid = (valid === false ? 1 : 0) | (validPublished === false ? 2 : 0);
  const { query, sql } = createPostgresSqlQuery();
  sql`UPDATE entities SET invalid = ${invalid}, dirty = 0 WHERE id = ${reference.entityInternalId}`;
  return await queryNone(databaseAdapter, context, query);
}
