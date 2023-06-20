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
  valid: boolean,
  validPublished: boolean | null
): PromiseResult<void, typeof ErrorType.Generic> {
  const invalid = (valid === false ? 1 : 0) | (validPublished === false ? 2 : 0);
  const { query, sql } = createSqliteSqlQuery();
  sql`UPDATE entities SET invalid = ${invalid}, dirty = 0 WHERE id = ${
    reference.entityInternalId as number
  }`;
  const result = await queryRun(database, context, query);
  return result.isOk() ? ok(undefined) : result;
}
