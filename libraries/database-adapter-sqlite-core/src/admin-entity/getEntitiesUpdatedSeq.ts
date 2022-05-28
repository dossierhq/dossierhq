import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import type { SequencesTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryOne } from '../QueryFunctions.js';

export async function getEntitiesUpdatedSeq(
  database: Database,
  context: TransactionContext
): PromiseResult<number, ErrorType.Generic> {
  const result = await queryOne<Pick<SequencesTable, 'value'>>(
    database,
    context,
    'UPDATE sequences SET value = value + 1 WHERE name = "entities_updated" RETURNING value'
  );
  if (result.isError()) return result;
  const { value } = result.value;

  return ok(value);
}
