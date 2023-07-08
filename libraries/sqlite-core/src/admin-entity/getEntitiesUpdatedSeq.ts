import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type { TransactionContext } from '@dossierhq/database-adapter';
import { createSqliteSqlQuery } from '@dossierhq/database-adapter';
import type { SequencesTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryOne } from '../QueryFunctions.js';

export async function getEntitiesUpdatedSeq(
  database: Database,
  context: TransactionContext,
): PromiseResult<number, typeof ErrorType.Generic> {
  const { query, sql } = createSqliteSqlQuery();
  sql`UPDATE sequences SET value = value + 1 WHERE name = ${'entities_updated'} RETURNING value`;
  const result = await queryOne<Pick<SequencesTable, 'value'>>(database, context, query);
  if (result.isError()) return result;
  const { value } = result.value;

  return ok(value);
}
