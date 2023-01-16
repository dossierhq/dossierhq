import type {
  EntityReference,
  ErrorType,
  PromiseResult,
  PublishingEvent,
  PublishingEventKind,
} from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type {
  DatabaseAdminEntityPublishingHistoryGetEntityInfoPayload,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import type {
  EntitiesTable,
  EntityPublishingEventsTable,
  EntityVersionsTable,
} from '../DatabaseSchema.js';
import { queryMany, queryNoneOrOne } from '../QueryFunctions.js';

export async function adminEntityPublishingHistoryGetEntityInfo(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  reference: EntityReference
): PromiseResult<
  DatabaseAdminEntityPublishingHistoryGetEntityInfoPayload,
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const result = await queryNoneOrOne<Pick<EntitiesTable, 'id' | 'auth_key' | 'resolved_auth_key'>>(
    databaseAdapter,
    context,
    {
      text: 'SELECT id, auth_key, resolved_auth_key FROM entities WHERE uuid = $1',
      values: [reference.id],
    }
  );
  if (result.isError()) {
    return result;
  }
  if (!result.value) {
    return notOk.NotFound('No such entity');
  }
  const {
    id: entityInternalId,
    auth_key: authKey,
    resolved_auth_key: resolvedAuthKey,
  } = result.value;
  return ok({ entityInternalId, authKey, resolvedAuthKey });
}

export async function adminEntityPublishingHistoryGetEvents(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  reference: DatabaseResolvedEntityReference
): PromiseResult<PublishingEvent[], typeof ErrorType.Generic> {
  const result = await queryMany<
    Pick<EntityVersionsTable, 'version'> &
      Pick<EntityPublishingEventsTable, 'published_at' | 'kind'> & {
        published_by: string;
      }
  >(databaseAdapter, context, {
    text: `SELECT ev.version, s.uuid AS published_by, epe.published_at, epe.kind
      FROM entity_publishing_events epe
        LEFT OUTER JOIN entity_versions ev ON (epe.entity_versions_id = ev.id)
        INNER JOIN subjects s ON (epe.published_by = s.id)
      WHERE epe.entities_id = $1
      ORDER BY epe.published_at`,
    values: [reference.entityInternalId],
  });
  if (result.isError()) {
    return result;
  }

  return ok(
    result.value.map((it) => {
      const event: PublishingEvent = {
        version: it.version,
        kind: it.kind as PublishingEventKind,
        publishedAt: it.published_at,
        publishedBy: it.published_by,
      };
      return event;
    })
  );
}
