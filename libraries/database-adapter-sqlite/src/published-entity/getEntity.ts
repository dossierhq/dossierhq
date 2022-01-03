import type { EntityReference, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type {
  DatabasePublishedEntityGetOnePayload,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { Temporal } from '@js-temporal/polyfill';
import type { SqliteDatabaseAdapter } from '..';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema';
import { queryNoneOrOne } from '../QueryFunctions';

export async function publishedEntityGetOne(
  databaseAdapter: SqliteDatabaseAdapter,
  context: TransactionContext,
  reference: EntityReference
): PromiseResult<DatabasePublishedEntityGetOnePayload, ErrorType.NotFound | ErrorType.Generic> {
  const result = await queryNoneOrOne<
    Pick<
      EntitiesTable,
      'uuid' | 'type' | 'name' | 'auth_key' | 'resolved_auth_key' | 'created_at'
    > &
      Pick<EntityVersionsTable, 'fields'>
  >(databaseAdapter, context, {
    text: `SELECT e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, ev.fields
    FROM entities e, entity_versions ev
    WHERE e.uuid = ?1
    AND e.published_entity_versions_id = ev.id`,
    values: [reference.id],
  });
  if (result.isError()) {
    return result;
  }
  if (!result.value) {
    return notOk.NotFound('No such entity');
  }
  const {
    uuid: id,
    type,
    name,
    auth_key: authKey,
    resolved_auth_key: resolvedAuthKey,
    created_at: createdAt,
    fields: fieldValues,
  } = result.value;

  return ok({
    id,
    type,
    name,
    authKey,
    resolvedAuthKey,
    createdAt: Temporal.Instant.from(createdAt),
    fieldValues: JSON.parse(fieldValues),
  });
}
