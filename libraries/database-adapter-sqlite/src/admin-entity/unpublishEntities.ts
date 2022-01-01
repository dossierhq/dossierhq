import type {
  AdminEntityStatus,
  EntityReference,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import { assertIsDefined, notOk, ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdminEntityUnpublishGetEntityInfoPayload,
  DatabaseAdminEntityUnpublishUpdateEntityPayload,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@jonasb/datadata-server';
import { SqliteQueryBuilder } from '@jonasb/datadata-server';
import { Temporal } from '@js-temporal/polyfill';
import type { SqliteDatabaseAdapter } from '..';
import type { EntitiesTable } from '../DatabaseSchema';
import { queryMany } from '../QueryFunctions';
import { resolveEntityStatus } from '../utils/CodecUtils';

export async function adminEntityUnpublishGetEntitiesInfo(
  databaseAdapter: SqliteDatabaseAdapter,
  context: TransactionContext,
  references: EntityReference[]
): PromiseResult<
  DatabaseAdminEntityUnpublishGetEntityInfoPayload[],
  ErrorType.NotFound | ErrorType.Generic
> {
  const qb = new SqliteQueryBuilder(
    'SELECT e.id, e.uuid, e.auth_key, e.resolved_auth_key, e.status, e.updated_at FROM entities e WHERE e.uuid IN ('
  );
  references.forEach(({ id }) => qb.addQuery(qb.addValue(id)));
  qb.addQuery(')');

  const result = await queryMany<
    Pick<EntitiesTable, 'id' | 'uuid' | 'auth_key' | 'resolved_auth_key' | 'status' | 'updated_at'>
  >(databaseAdapter, context, qb.build());
  if (result.isError()) {
    return result;
  }
  const entitiesInfo = result.value;

  const missingEntityIds = references
    .filter((reference) => !entitiesInfo.find((it) => it.uuid === reference.id))
    .map((it) => it.id);
  if (missingEntityIds.length > 0) {
    return notOk.NotFound(`No such entities: ${missingEntityIds.join(', ')}`);
  }
  return ok(
    references.map((reference) => {
      const entityInfo = entitiesInfo.find((it) => it.uuid === reference.id);
      assertIsDefined(entityInfo);

      return {
        id: entityInfo.uuid,
        entityInternalId: entityInfo.id,
        authKey: entityInfo.auth_key,
        resolvedAuthKey: entityInfo.resolved_auth_key,
        status: resolveEntityStatus(entityInfo.status),
        updatedAt: Temporal.Instant.from(entityInfo.updated_at),
      };
    })
  );
}

export async function adminEntityUnpublishEntities(
  databaseAdapter: SqliteDatabaseAdapter,
  context: TransactionContext,
  status: AdminEntityStatus,
  references: DatabaseResolvedEntityReference[]
): PromiseResult<DatabaseAdminEntityUnpublishUpdateEntityPayload[], ErrorType.Generic> {
  const now = Temporal.Now.instant();
  const qb = new SqliteQueryBuilder(
    `UPDATE entities
  SET
    published_entity_versions_id = NULL,
    updated_at = ?1,
    status = ?2
  WHERE id IN (`,
    [now.toString(), status]
  );
  references.forEach(({ entityInternalId }) =>
    qb.addQuery(qb.addValue(entityInternalId as number))
  );
  qb.addQuery(') RETURNING id');

  // TODO reset published_fts
  const result = await queryMany<Pick<EntitiesTable, 'id'>>(databaseAdapter, context, qb.build());
  if (result.isError()) {
    return result;
  }
  return ok(
    references.map((reference) => {
      const row = result.value.find((it) => it.id === reference.entityInternalId);
      assertIsDefined(row);
      return { entityInternalId: row.id, updatedAt: now };
    })
  );
}

export async function adminEntityUnpublishGetPublishedReferencedEntities(
  databaseAdapter: SqliteDatabaseAdapter,
  context: TransactionContext,
  reference: DatabaseResolvedEntityReference
): PromiseResult<EntityReference[], ErrorType.Generic> {
  const result = await queryMany<Pick<EntitiesTable, 'uuid'>>(databaseAdapter, context, {
    text: `SELECT e.uuid
       FROM entity_version_references evr, entity_versions ev, entities e
       WHERE evr.entities_id = $1
         AND evr.entity_versions_id = ev.id
         AND ev.entities_id = e.id
         AND e.published_entity_versions_id = ev.id`,
    values: [reference.entityInternalId as number],
  });
  if (result.isError()) {
    return result;
  }

  return result.map((row) => row.map(({ uuid }) => ({ id: uuid })));
}
