import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import { buildPostgresSqlQuery, type TransactionContext } from '@dossierhq/database-adapter';
import { type PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryRun } from '../QueryFunctions.js';

export async function schemaUpdateDeleteComponentTypesFromIndexes(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  componentTypes: string[],
): PromiseResult<void, typeof ErrorType.Generic> {
  if (componentTypes.length > 0) {
    const latestResult = await queryRun(
      adapter,
      context,
      buildPostgresSqlQuery(({ sql }) => {
        sql`DELETE FROM entity_latest_value_types WHERE value_type = ANY(${componentTypes})`;
      }),
    );
    if (latestResult.isError()) return latestResult;

    const publishedResult = await queryRun(
      adapter,
      context,
      buildPostgresSqlQuery(({ sql }) => {
        sql`DELETE FROM entity_published_value_types WHERE value_type = ANY(${componentTypes})`;
      }),
    );
    if (publishedResult.isError()) return publishedResult;
  }
  return ok(undefined);
}
