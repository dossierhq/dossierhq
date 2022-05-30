import type { EntityReference, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdminEntityGetReferenceEntityInfoPayload,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import type { EntitiesTable } from '../DatabaseSchema.js';
import { queryMany } from '../QueryFunctions.js';

export async function adminEntityGetReferenceEntitiesInfo(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  references: EntityReference[]
): PromiseResult<DatabaseAdminEntityGetReferenceEntityInfoPayload[], typeof ErrorType.Generic> {
  const result = await queryMany<Pick<EntitiesTable, 'id' | 'type' | 'uuid'>>(
    databaseAdapter,
    context,
    {
      text: 'SELECT id, uuid, type FROM entities WHERE uuid = ANY($1)',
      values: [references.map(({ id }) => id)],
    }
  );
  if (result.isError()) {
    return result;
  }
  return ok(result.value.map((it) => ({ entityInternalId: it.id, id: it.uuid, type: it.type })));
}
