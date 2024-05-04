import type { ErrorType, PromiseResult } from '@dossierhq/core';
import {
  buildPostgresSqlQuery,
  type DatabaseAdminEntityUniqueIndexValue,
  type DatabaseResolvedEntityReference,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { UniqueIndexValuesTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryMany } from '../QueryFunctions.js';

export async function adminEntityUniqueIndexGetValues(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  entity: DatabaseResolvedEntityReference,
): PromiseResult<DatabaseAdminEntityUniqueIndexValue[], typeof ErrorType.Generic> {
  const result = await queryMany<
    Pick<UniqueIndexValuesTable, 'index_name' | 'value' | 'latest' | 'published'>
  >(
    databaseAdapter,
    context,
    buildPostgresSqlQuery(({ sql }) => {
      sql`SELECT index_name, value, latest, published FROM unique_index_values WHERE entities_id = ${entity.entityInternalId}`;
    }),
  );
  if (result.isError()) return result;

  return result.map((rows) =>
    rows.map((row) => ({
      index: row.index_name,
      value: row.value,
      latest: row.latest,
      published: row.published,
    })),
  );
}
