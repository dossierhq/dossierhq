import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import { buildPostgresSqlQuery, type TransactionContext } from '@dossierhq/database-adapter';
import { type PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryRun } from '../QueryFunctions.js';

export async function schemaUpdateDeleteValueTypesFromIndexes(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  valueTypes: string[],
): PromiseResult<void, typeof ErrorType.Generic> {
  if (valueTypes.length > 0) {
    const latestResult = await queryRun(
      adapter,
      context,
      buildPostgresSqlQuery(({ sql }) => {
        sql`DELETE FROM entity_latest_value_types WHERE value_type = ANY(${valueTypes})`;
      }),
    );
    if (latestResult.isError()) return latestResult;

    const publishedResult = await queryRun(
      adapter,
      context,
      buildPostgresSqlQuery(({ sql }) => {
        sql`DELETE FROM entity_published_value_types WHERE value_type = ANY(${valueTypes})`;
      }),
    );
    if (publishedResult.isError()) return publishedResult;
  }
  return ok(undefined);
}
