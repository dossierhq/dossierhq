import type { EntityReference, ErrorType, PromiseResult } from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type {
  DatabaseAdminEntityGetReferenceEntityInfoPayload,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { createSqliteSqlQuery } from '@dossierhq/database-adapter';
import type { EntitiesTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryMany } from '../QueryFunctions.js';

export async function adminEntityGetReferenceEntitiesInfo(
  database: Database,
  context: TransactionContext,
  references: EntityReference[]
): PromiseResult<DatabaseAdminEntityGetReferenceEntityInfoPayload[], typeof ErrorType.Generic> {
  if (references.length === 0) return ok([]);

  const { addValueList, query, sql } = createSqliteSqlQuery();
  sql`SELECT id, uuid, type, status FROM entities WHERE uuid IN ${addValueList(
    references.map(({ id }) => id)
  )}`;

  const result = await queryMany<Pick<EntitiesTable, 'id' | 'type' | 'uuid' | 'status'>>(
    database,
    context,
    query
  );
  if (result.isError()) return result;

  return ok(
    result.value.map((it) => ({
      entityInternalId: it.id,
      id: it.uuid,
      type: it.type,
      status: it.status,
    }))
  );
}
