import type { EntityReference, ErrorType, PromiseResult } from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type {
  DatabaseAdminEntityHistoryGetEntityInfoPayload,
  DatabaseAdminEntityHistoryGetVersionInfoPayload,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryMany, queryNoneOrOne } from '../QueryFunctions.js';

export async function adminEntityHistoryGetEntityInfo(
  database: Database,
  context: TransactionContext,
  reference: EntityReference,
): PromiseResult<
  DatabaseAdminEntityHistoryGetEntityInfoPayload,
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const result = await queryNoneOrOne<
    Pick<EntitiesTable, 'id' | 'published_entity_versions_id' | 'auth_key' | 'resolved_auth_key'>
  >(database, context, {
    text: `SELECT id, published_entity_versions_id, auth_key, resolved_auth_key
      FROM entities e
      WHERE uuid = ?1`,
    values: [reference.id],
  });
  if (result.isError()) {
    return result;
  }
  if (!result.value) {
    return notOk.NotFound('No such entity');
  }
  const {
    id: entityInternalId,
    published_entity_versions_id: entityVersionInternalId,
    auth_key: authKey,
    resolved_auth_key: resolvedAuthKey,
  } = result.value;
  return ok({ entityInternalId, entityVersionInternalId, authKey, resolvedAuthKey });
}

export async function adminEntityHistoryGetVersionsInfo(
  database: Database,
  context: TransactionContext,
  reference: DatabaseResolvedEntityReference,
): PromiseResult<DatabaseAdminEntityHistoryGetVersionInfoPayload[], typeof ErrorType.Generic> {
  const result = await queryMany<
    Pick<EntityVersionsTable, 'id' | 'version' | 'created_at'> & {
      created_by_uuid: string;
    }
  >(database, context, {
    text: `SELECT
    ev.id,
    ev.version,
    ev.created_at,
    s.uuid AS created_by_uuid
   FROM entity_versions ev, subjects s
   WHERE ev.entities_id = ?1 AND ev.created_by = s.id
   ORDER BY ev.version`,
    values: [reference.entityInternalId as number],
  });
  if (result.isError()) {
    return result;
  }

  return ok(
    result.value.map((it) => ({
      entityInternalId: reference.entityInternalId,
      entityVersionInternalId: it.id,
      version: it.version,
      createdAt: new Date(it.created_at),
      createdBy: it.created_by_uuid,
    })),
  );
}
