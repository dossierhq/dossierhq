import { ok, type ChangelogQuery, type ErrorType, type PromiseResult } from '@dossierhq/core';
import {
  type DatabaseResolvedEntityReference,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryOne } from '../QueryFunctions.js';
import {
  generateGetChangelogTotalCountQuery,
  type TotalCountRow,
} from './ChangelogQueryGenerator.js';

export async function eventGetChangelogEventsTotalCount(
  database: PostgresDatabaseAdapter,
  context: TransactionContext,
  query: ChangelogQuery,
  entity: DatabaseResolvedEntityReference | null,
): PromiseResult<number, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const sqlQueryResult = generateGetChangelogTotalCountQuery(query, entity);
  if (sqlQueryResult.isError()) return sqlQueryResult;

  const totalResult = await queryOne<TotalCountRow>(database, context, sqlQueryResult.value);
  if (totalResult.isError()) return totalResult;

  return ok(totalResult.value.count);
}
