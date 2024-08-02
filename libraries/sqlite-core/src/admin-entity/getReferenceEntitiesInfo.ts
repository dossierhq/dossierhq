import { ok, type EntityReference, type ErrorType, type PromiseResult } from '@dossierhq/core';
import {
  createSqliteSqlQuery,
  type DatabaseAdminEntityGetReferenceEntityInfoPayload,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { EntitiesTable } from '../DatabaseSchema.js';
import { queryMany, type Database } from '../QueryFunctions.js';
import { assertIsDefined } from '../utils/AssertUtils.js';

export async function adminEntityGetReferenceEntitiesInfo(
  database: Database,
  context: TransactionContext,
  references: EntityReference[],
): PromiseResult<DatabaseAdminEntityGetReferenceEntityInfoPayload[], typeof ErrorType.Generic> {
  if (references.length === 0) return ok([]);

  const { addValueList, query, sql } = createSqliteSqlQuery();
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  sql`SELECT id, uuid, type, status FROM entities WHERE uuid IN ${addValueList(
    references.map(({ id }) => id),
  )}`;

  const result = await queryMany<Pick<EntitiesTable, 'id' | 'type' | 'uuid' | 'status'>>(
    database,
    context,
    query,
  );
  if (result.isError()) return result;

  return ok(
    result.value.map((it) => {
      assertIsDefined(it.uuid);
      return {
        entityInternalId: it.id,
        id: it.uuid,
        type: it.type,
        status: it.status,
      };
    }),
  );
}
