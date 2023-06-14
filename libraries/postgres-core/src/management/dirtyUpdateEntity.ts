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
  valid: boolean
): PromiseResult<void, typeof ErrorType.Generic> {
  const { query, sql } = createPostgresSqlQuery();
  sql`UPDATE entities SET valid = ${valid}, dirty = dirty & (~1) WHERE id = ${reference.entityInternalId}`;
  return await queryNone(databaseAdapter, context, query);
}
