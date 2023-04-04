import type { ErrorType, PromiseResult } from '@dossierhq/core';
import {
  createSqliteSqlQuery,
  type DatabaseResolvedEntityReference,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import { queryRun, type Database } from '../QueryFunctions.js';

export async function managementRevalidateUpdateEntity(
  database: Database,
  context: TransactionContext,
  reference: DatabaseResolvedEntityReference,
  valid: boolean
): PromiseResult<void, typeof ErrorType.Generic> {
  const { query, sql } = createSqliteSqlQuery();
  sql`UPDATE entities SET valid = ${valid ? 1 : 0}, revalidate = FALSE WHERE id = ${
    reference.entityInternalId as number
  }`;
  return await queryRun(database, context, query);
}
