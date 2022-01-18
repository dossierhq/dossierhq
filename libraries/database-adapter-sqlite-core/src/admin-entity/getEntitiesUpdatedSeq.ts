import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import type { SqliteDatabaseAdapter } from '..';
import type { SequencesTable } from '../DatabaseSchema';
import { queryOne } from '../QueryFunctions';

export async function getEntitiesUpdatedSeq(
  databaseAdapter: SqliteDatabaseAdapter,
  context: TransactionContext
): PromiseResult<number, ErrorType.Generic> {
  const result = await queryOne<Pick<SequencesTable, 'value'>>(
    databaseAdapter,
    context,
    'UPDATE sequences SET value = value + 1 WHERE name = "entities_updated" RETURNING value'
  );
  if (result.isError()) return result;
  const { value } = result.value;

  return ok(value);
}
