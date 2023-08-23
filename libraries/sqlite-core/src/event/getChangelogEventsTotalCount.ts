import { ok, type ChangelogEventQuery, type ErrorType, type PromiseResult } from '@dossierhq/core';
import {
  type DatabaseResolvedEntityReference,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import { queryOne, type Database } from '../QueryFunctions.js';
import {
  generateGetChangelogTotalCountQuery,
  type TotalCountRow,
} from './ChangelogQueryGenerator.js';

export async function eventGetChangelogEventsTotalCount(
  database: Database,
  context: TransactionContext,
  query: ChangelogEventQuery,
  entity: DatabaseResolvedEntityReference | null,
): PromiseResult<number, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const sqlQueryResult = generateGetChangelogTotalCountQuery(query, entity);
  if (sqlQueryResult.isError()) return sqlQueryResult;

  const totalResult = await queryOne<TotalCountRow>(database, context, sqlQueryResult.value);
  if (totalResult.isError()) return totalResult;

  return ok(totalResult.value.count);
}
