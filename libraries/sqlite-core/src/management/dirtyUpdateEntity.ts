import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import {
  createSqliteSqlQuery,
  type DatabaseResolvedEntityReference,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import { queryRun, type Database } from '../QueryFunctions.js';

export async function managementDirtyUpdateEntity(
  database: Database,
  context: TransactionContext,
  reference: DatabaseResolvedEntityReference,
  valid: boolean
): PromiseResult<void, typeof ErrorType.Generic> {
  const { query, sql } = createSqliteSqlQuery();
  sql`UPDATE entities SET valid = ${valid ? 1 : 0}, dirty = 0 WHERE id = ${
    reference.entityInternalId as number
  }`;
  const result = await queryRun(database, context, query);
  return result.isOk() ? ok(undefined) : result;
}
