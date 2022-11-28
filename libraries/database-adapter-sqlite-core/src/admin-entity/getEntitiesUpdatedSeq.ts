import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import { createSqliteSqlQuery } from '@jonasb/datadata-database-adapter';
import type { SequencesTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryOne } from '../QueryFunctions.js';

export async function getEntitiesUpdatedSeq(
  database: Database,
  context: TransactionContext
): PromiseResult<number, typeof ErrorType.Generic> {
  const { query, sql } = createSqliteSqlQuery();
  sql`UPDATE sequences SET value = value + 1 WHERE name = ${'entities_updated'} RETURNING value`;
  const result = await queryOne<Pick<SequencesTable, 'value'>>(database, context, query);
  if (result.isError()) return result;
  const { value } = result.value;

  return ok(value);
}
