import type { EntityReference, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type {
  DatabasePublishedEntityGetOnePayload,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { SqliteQueryBuilder } from '@jonasb/datadata-database-adapter';
import { Temporal } from '@js-temporal/polyfill';
import type { SqliteDatabaseAdapter } from '..';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema';
import { queryMany } from '../QueryFunctions';

export async function publishedEntityGetEntities(
  databaseAdapter: SqliteDatabaseAdapter,
  context: TransactionContext,
  references: EntityReference[]
): PromiseResult<DatabasePublishedEntityGetOnePayload[], ErrorType.Generic> {
  const qb =
    new SqliteQueryBuilder(`SELECT e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, ev.fields
    FROM entities e, entity_versions ev WHERE`);
  qb.addQuery(
    `e.uuid IN ${qb.addValueList(
      references.map((it) => it.id)
    )} AND e.published_entity_versions_id = ev.id`
  );

  const result = await queryMany<
    Pick<
      EntitiesTable,
      'uuid' | 'type' | 'name' | 'auth_key' | 'resolved_auth_key' | 'created_at'
    > &
      Pick<EntityVersionsTable, 'fields'>
  >(databaseAdapter, context, qb.build());
  if (result.isError()) {
    return result;
  }

  return ok(
    result.value.map((row) => ({
      id: row.uuid,
      type: row.type,
      name: row.name,
      authKey: row.auth_key,
      resolvedAuthKey: row.resolved_auth_key,
      createdAt: Temporal.Instant.from(row.created_at),
      fieldValues: JSON.parse(row.fields),
    }))
  );
}
