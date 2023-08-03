import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import { buildSqliteSqlQuery, type TransactionContext } from '@dossierhq/database-adapter';
import { queryRun, type Database } from '../QueryFunctions.js';

export async function schemaUpdateModifyIndexes(
  database: Database,
  context: TransactionContext,
  deleteUniqueValueIndexes: string[],
  renameUniqueValueIndexes: Record<string, string>,
): PromiseResult<void, typeof ErrorType.Generic> {
  if (deleteUniqueValueIndexes.length > 0) {
    const deleteResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(({ sql, addValueList }) => {
        sql`DELETE FROM unique_index_values WHERE index_name IN (${addValueList(
          deleteUniqueValueIndexes,
        )})`;
      }),
    );
    if (deleteResult.isError()) return deleteResult;
  }

  for (const [oldName, newName] of Object.entries(renameUniqueValueIndexes)) {
    const renameResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(({ sql }) => {
        sql`UPDATE unique_index_values SET index_name = ${newName} WHERE index_name = ${oldName}`;
      }),
    );
    if (renameResult.isError()) return renameResult;
  }

  return ok(undefined);
}
