import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import { buildPostgresSqlQuery, type TransactionContext } from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryRun } from '../QueryFunctions.js';

export async function schemaUpdateRenameTypes(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  entityTypes: Record<string, string>,
  componentTypes: Record<string, string>,
): PromiseResult<void, typeof ErrorType.Generic> {
  for (const [oldName, newName] of Object.entries(entityTypes)) {
    const result = await queryRun(
      adapter,
      context,
      buildPostgresSqlQuery(({ sql }) => {
        sql`UPDATE entities SET type = ${newName} WHERE type = ${oldName}`;
      }),
    );
    if (result.isError()) return result;
  }

  for (const [oldName, newName] of Object.entries(componentTypes)) {
    const latestResult = await queryRun(
      adapter,
      context,
      buildPostgresSqlQuery(({ sql }) => {
        sql`UPDATE entity_latest_value_types SET value_type = ${newName} WHERE value_type = ${oldName}`;
      }),
    );
    if (latestResult.isError()) return latestResult;

    const publishedResult = await queryRun(
      adapter,
      context,
      buildPostgresSqlQuery(({ sql }) => {
        sql`UPDATE entity_published_value_types SET value_type = ${newName} WHERE value_type = ${oldName}`;
      }),
    );
    if (publishedResult.isError()) return publishedResult;
  }

  return ok(undefined);
}
