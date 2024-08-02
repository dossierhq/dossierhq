import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import { createSqliteSqlQuery, type TransactionContext } from '@dossierhq/database-adapter';
import type { SequencesTable } from '../DatabaseSchema.js';
import { queryOne, type Database } from '../QueryFunctions.js';

export async function getEntitiesUpdatedSeq(
  database: Database,
  context: TransactionContext,
): PromiseResult<number, typeof ErrorType.Generic> {
  const { query, sql } = createSqliteSqlQuery();
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  sql`UPDATE sequences SET value = value + 1 WHERE name = ${'entities_updated'} RETURNING value`;
  const result = await queryOne<Pick<SequencesTable, 'value'>>(database, context, query);
  if (result.isError()) return result;
  const { value } = result.value;

  return ok(value);
}
