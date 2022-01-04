import type { EntityReference, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdminEntityGetReferenceEntityInfoPayload,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { SqliteQueryBuilder } from '@jonasb/datadata-database-adapter';
import type { SqliteDatabaseAdapter } from '..';
import type { EntitiesTable } from '../DatabaseSchema';
import { queryMany } from '../QueryFunctions';

export async function adminEntityGetReferenceEntitiesInfo(
  databaseAdapter: SqliteDatabaseAdapter,
  context: TransactionContext,
  references: EntityReference[]
): PromiseResult<DatabaseAdminEntityGetReferenceEntityInfoPayload[], ErrorType.Generic> {
  const qb = new SqliteQueryBuilder('SELECT id, uuid, type FROM entities WHERE');
  qb.addQuery(`uuid IN ${qb.addValueList(references.map(({ id }) => id))}`);

  const result = await queryMany<Pick<EntitiesTable, 'id' | 'type' | 'uuid'>>(
    databaseAdapter,
    context,
    qb.build()
  );
  if (result.isError()) {
    return result;
  }
  return ok(result.value.map((it) => ({ entityInternalId: it.id, id: it.uuid, type: it.type })));
}
