import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type {
  DatabaseAdminEntityUniqueIndexValue,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { buildSqliteSqlQuery } from '@jonasb/datadata-database-adapter';
import type { EntityUniqueIndexesTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryMany } from '../QueryFunctions.js';

export async function adminEntityUniqueIndexGetValues(
  database: Database,
  context: TransactionContext,
  entity: DatabaseResolvedEntityReference
): PromiseResult<DatabaseAdminEntityUniqueIndexValue[], typeof ErrorType.Generic> {
  const result = await queryMany<
    Pick<EntityUniqueIndexesTable, 'index_name' | 'value' | 'latest' | 'published'>
  >(
    database,
    context,
    buildSqliteSqlQuery(({ sql }) => {
      sql`SELECT index_name, value, latest, published FROM entity_unique_indexes WHERE entities_id = ${
        entity.entityInternalId as number
      }`;
    })
  );
  if (result.isError()) return result;

  return result.map((rows) =>
    rows.map((row) => ({
      index: row.index_name,
      value: row.value,
      latest: row.latest,
      published: row.published,
    }))
  );
}
