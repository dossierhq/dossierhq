import type { ErrorType, PromiseResult } from '@dossierhq/core';
import {
  buildSqliteSqlQuery,
  type DatabaseAdminEntityUniqueIndexValue,
  type DatabaseResolvedEntityReference,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { UniqueIndexValuesTable } from '../DatabaseSchema.js';
import { queryMany, type Database } from '../QueryFunctions.js';

export async function adminEntityUniqueIndexGetValues(
  database: Database,
  context: TransactionContext,
  entity: DatabaseResolvedEntityReference,
): PromiseResult<DatabaseAdminEntityUniqueIndexValue[], typeof ErrorType.Generic> {
  const result = await queryMany<
    Pick<UniqueIndexValuesTable, 'index_name' | 'value' | 'latest' | 'published'>
  >(
    database,
    context,
    buildSqliteSqlQuery(({ sql }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      sql`SELECT index_name, value, latest, published FROM unique_index_values WHERE entities_id = ${
        entity.entityInternalId as number
      }`;
    }),
  );
  if (result.isError()) return result;

  return result.map((rows) =>
    rows.map((row) => ({
      index: row.index_name,
      value: row.value,
      latest: !!row.latest,
      published: !!row.published,
    })),
  );
}
