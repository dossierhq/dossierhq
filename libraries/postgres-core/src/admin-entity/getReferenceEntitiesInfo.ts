import { ok, type EntityReference, type ErrorType, type PromiseResult } from '@dossierhq/core';
import type {
  DatabaseAdminEntityGetReferenceEntityInfoPayload,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { EntitiesTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryMany } from '../QueryFunctions.js';
import { assertIsDefined } from '../utils/AssertUtils.js';
import { resolveEntityStatus } from '../utils/CodecUtils.js';

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
  if (result.isError()) return result;

  return ok(
    result.value.map((it) => {
      assertIsDefined(it.uuid);
      return {
        entityInternalId: it.id,
        id: it.uuid,
        type: it.type,
        status: resolveEntityStatus(it.status),
      };
    }),
  );
}
