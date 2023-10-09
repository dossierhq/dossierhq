import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import { buildSqliteSqlQuery, type TransactionContext } from '@dossierhq/database-adapter';
import { queryRun, type Database } from '../QueryFunctions.js';

export async function schemaUpdateDeleteComponentTypesFromIndexes(
  database: Database,
  context: TransactionContext,
  componentTypes: string[],
): PromiseResult<void, typeof ErrorType.Generic> {
  if (componentTypes.length > 0) {
    const latestResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(({ sql, addValueList }) => {
        sql`DELETE FROM entity_latest_value_types WHERE value_type IN ${addValueList(
          componentTypes,
        )}`;
      }),
    );
    if (latestResult.isError()) return latestResult;

    const publishedResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(({ sql, addValueList }) => {
        sql`DELETE FROM entity_published_value_types WHERE value_type IN ${addValueList(
          componentTypes,
        )}`;
      }),
    );
    if (publishedResult.isError()) return publishedResult;
  }
  return ok(undefined);
}
