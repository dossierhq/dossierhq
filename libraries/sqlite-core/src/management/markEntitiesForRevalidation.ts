import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import {
  createSqliteSqlQuery,
  type DatabaseMarkEntitiesForRevalidationPayload,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import { queryRun, type Database } from '../QueryFunctions.js';

export async function managementMarkEntitiesForRevalidation(
  database: Database,
  context: TransactionContext,
  entityTypes: string[],
  valueTypes: string[]
): PromiseResult<DatabaseMarkEntitiesForRevalidationPayload, typeof ErrorType.Generic> {
  const { sql, query, addValueList } = createSqliteSqlQuery();
  if (valueTypes.length > 0) {
    //TODO be more specific when we have a value type -> entity index
    sql`UPDATE entities SET revalidate = TRUE WHERE NOT revalidate`;
  } else {
    sql`UPDATE entities SET revalidate = TRUE WHERE NOT revalidate AND type IN ${addValueList(
      entityTypes
    )}`;
  }
  const result = await queryRun(database, context, query);
  if (result.isError()) return result;

  return ok({ count: result.value });
}
