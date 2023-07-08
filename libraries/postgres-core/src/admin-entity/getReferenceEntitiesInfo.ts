import type { EntityReference, ErrorType, PromiseResult } from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type {
  DatabaseAdminEntityGetReferenceEntityInfoPayload,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import type { EntitiesTable } from '../DatabaseSchema.js';
import { queryMany } from '../QueryFunctions.js';

export async function adminEntityGetReferenceEntitiesInfo(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  references: EntityReference[],
): PromiseResult<DatabaseAdminEntityGetReferenceEntityInfoPayload[], typeof ErrorType.Generic> {
  if (references.length === 0) return ok([]);

  const result = await queryMany<Pick<EntitiesTable, 'id' | 'type' | 'uuid' | 'status'>>(
    databaseAdapter,
    context,
    {
      text: 'SELECT id, uuid, type, status FROM entities WHERE uuid = ANY($1)',
      values: [references.map(({ id }) => id)],
    },
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
    })),
  );
}
