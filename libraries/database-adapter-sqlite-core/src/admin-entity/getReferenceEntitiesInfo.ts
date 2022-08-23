import type { EntityReference, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdminEntityGetReferenceEntityInfoPayload,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { SqliteQueryBuilder } from '@jonasb/datadata-database-adapter';
import type { EntitiesTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryMany } from '../QueryFunctions.js';

export async function adminEntityGetReferenceEntitiesInfo(
  database: Database,
  context: TransactionContext,
  references: EntityReference[]
): PromiseResult<DatabaseAdminEntityGetReferenceEntityInfoPayload[], typeof ErrorType.Generic> {
  if (references.length === 0) return ok([]);

  const qb = new SqliteQueryBuilder('SELECT id, uuid, type, status FROM entities WHERE');
  qb.addQuery(`uuid IN ${qb.addValueList(references.map(({ id }) => id))}`);

  const result = await queryMany<Pick<EntitiesTable, 'id' | 'type' | 'uuid' | 'status'>>(
    database,
    context,
    qb.build()
  );
  if (result.isError()) {
    return result;
  }
  return ok(
    result.value.map((it) => ({
      entityInternalId: it.id,
      id: it.uuid,
      type: it.type,
      status: it.status,
    }))
  );
}
