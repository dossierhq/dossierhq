import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import { buildSqliteSqlQuery, type TransactionContext } from '@dossierhq/database-adapter';
import { queryRun, type Database } from '../QueryFunctions.js';

export async function schemaUpdateRenameTypes(
  database: Database,
  context: TransactionContext,
  entityTypes: Record<string, string>,
  componentTypes: Record<string, string>,
): PromiseResult<void, typeof ErrorType.Generic> {
  for (const [oldName, newName] of Object.entries(entityTypes)) {
    const result = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(({ sql }) => {
        sql`UPDATE entities SET type = ${newName} WHERE type = ${oldName}`;
      }),
    );
    if (result.isError()) return result;
  }

  for (const [oldName, newName] of Object.entries(componentTypes)) {
    const latestResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(({ sql }) => {
        sql`UPDATE entity_latest_value_types SET value_type = ${newName} WHERE value_type = ${oldName}`;
      }),
    );
    if (latestResult.isError()) return latestResult;

    const publishedResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(({ sql }) => {
        sql`UPDATE entity_published_value_types SET value_type = ${newName} WHERE value_type = ${oldName}`;
      }),
    );
    if (publishedResult.isError()) return publishedResult;
  }

  return ok(undefined);
}
