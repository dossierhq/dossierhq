import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import { buildPostgresSqlQuery, type TransactionContext } from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryRun } from '../QueryFunctions.js';

export async function schemaUpdateModifyIndexes(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  deleteUniqueValueIndexes: string[],
  renameUniqueValueIndexes: Record<string, string>,
): PromiseResult<void, typeof ErrorType.Generic> {
  if (deleteUniqueValueIndexes.length > 0) {
    const deleteResult = await queryRun(
      adapter,
      context,
      buildPostgresSqlQuery(({ sql }) => {
        sql`DELETE FROM unique_index_values WHERE index_name = ANY(${deleteUniqueValueIndexes})`;
      }),
    );
    if (deleteResult.isError()) return deleteResult;
  }

  for (const [oldName, newName] of Object.entries(renameUniqueValueIndexes)) {
    const renameResult = await queryRun(
      adapter,
      context,
      buildPostgresSqlQuery(({ sql }) => {
        sql`UPDATE unique_index_values SET index_name = ${newName} WHERE index_name = ${oldName}`;
      }),
    );
    if (renameResult.isError()) return renameResult;
  }

  return ok(undefined);
}
