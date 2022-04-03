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
} from '@jonasb/datadata-database-adapter';
import { SqliteQueryBuilder } from '@jonasb/datadata-database-adapter';
import { Temporal } from '@js-temporal/polyfill';
import type { EntitiesTable } from '../DatabaseSchema';
import type { Database } from '../QueryFunctions';
import { queryMany, queryNone } from '../QueryFunctions';
import { resolveEntityStatus } from '../utils/CodecUtils';
import { getEntitiesUpdatedSeq } from './getEntitiesUpdatedSeq';

export async function adminEntityUnpublishGetEntitiesInfo(
  database: Database,
  context: TransactionContext,
  references: EntityReference[]
): PromiseResult<
  DatabaseAdminEntityUnpublishGetEntityInfoPayload[],
  ErrorType.NotFound | ErrorType.Generic
> {
  const qb = new SqliteQueryBuilder(
    'SELECT e.id, e.uuid, e.auth_key, e.resolved_auth_key, e.status, e.updated_at FROM entities e WHERE'
  );
  qb.addQuery(`e.uuid IN ${qb.addValueList(references.map(({ id }) => id))}`);

  const result = await queryMany<
    Pick<EntitiesTable, 'id' | 'uuid' | 'auth_key' | 'resolved_auth_key' | 'status' | 'updated_at'>
  >(database, context, qb.build());
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
  database: Database,
  context: TransactionContext,
  status: AdminEntityStatus,
  references: DatabaseResolvedEntityReference[]
): PromiseResult<DatabaseAdminEntityUnpublishUpdateEntityPayload[], ErrorType.Generic> {
  const updatedSeqResult = await getEntitiesUpdatedSeq(database, context);
  if (updatedSeqResult.isError()) return updatedSeqResult;

  const now = Temporal.Now.instant();
  const qb = new SqliteQueryBuilder(
    `UPDATE entities
     SET
       published_entity_versions_id = NULL,
       updated_at = ?1,
       updated_seq = ?2,
       status = ?3
     WHERE`,
    [now.toString(), updatedSeqResult.value, status]
  );
  qb.addQuery(
    `id IN ${qb.addValueList(
      references.map(({ entityInternalId }) => entityInternalId as number)
    )} RETURNING id`
  );
  const result = await queryMany<Pick<EntitiesTable, 'id'>>(database, context, qb.build());
  if (result.isError()) {
    return result;
  }

  const qbFts = new SqliteQueryBuilder(`DELETE FROM entities_published_fts WHERE`);
  qbFts.addQuery(
    `docid IN ${qbFts.addValueList(
      references.map(({ entityInternalId }) => entityInternalId as number)
    )}`
  );
  const ftsResult = await queryNone(database, context, qbFts.build());
  if (ftsResult.isError()) return ftsResult;

  return ok(
    references.map((reference) => {
      const row = result.value.find((it) => it.id === reference.entityInternalId);
      assertIsDefined(row);
      return { entityInternalId: row.id, updatedAt: now };
    })
  );
}

export async function adminEntityUnpublishGetPublishedReferencedEntities(
  database: Database,
  context: TransactionContext,
  reference: DatabaseResolvedEntityReference
): PromiseResult<EntityReference[], ErrorType.Generic> {
  const result = await queryMany<Pick<EntitiesTable, 'uuid'>>(database, context, {
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
