import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdminEntityUniqueIndexValue,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';

export async function adminEntityUniqueIndexGetValues(
  _databaseAdapter: PostgresDatabaseAdapter,
  _context: TransactionContext,
  _entity: DatabaseResolvedEntityReference
): PromiseResult<DatabaseAdminEntityUniqueIndexValue[], typeof ErrorType.Generic> {
  return ok([]);
  /*
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
  );*/
}
