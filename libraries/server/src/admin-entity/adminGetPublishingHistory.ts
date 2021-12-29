import type {
  EntityReferenceWithAuthKeys,
  ErrorType,
  PromiseResult,
  PublishingEvent,
  PublishingEventKind,
  PublishingHistory,
} from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '..';
import { authVerifyAuthorizationKey } from '../Auth';
import * as Db from '../Database';
import type {
  EntitiesTable,
  EntityPublishingEventsTable,
  EntityVersionsTable,
} from '../DatabaseTables';

export async function adminGetPublishingHistory(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  reference: EntityReferenceWithAuthKeys
): PromiseResult<
  PublishingHistory,
  ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const entityInfo = await Db.queryNoneOrOne<
    Pick<EntitiesTable, 'id' | 'auth_key' | 'resolved_auth_key'>
  >(
    databaseAdapter,
    context,
    'SELECT id, auth_key, resolved_auth_key FROM entities WHERE uuid = $1',
    [reference.id]
  );
  if (!entityInfo) {
    return notOk.NotFound('No such entity');
  }

  const authResult = await authVerifyAuthorizationKey(
    authorizationAdapter,
    context,
    reference?.authKeys,
    { authKey: entityInfo.auth_key, resolvedAuthKey: entityInfo.resolved_auth_key }
  );
  if (authResult.isError()) {
    return authResult;
  }

  const publishEvents = await Db.queryMany<
    Pick<EntityVersionsTable, 'version'> &
      Pick<EntityPublishingEventsTable, 'published_at' | 'kind'> & {
        published_by: string;
      }
  >(
    databaseAdapter,
    context,
    `SELECT ev.version, s.uuid AS published_by, epe.published_at, epe.kind
      FROM entity_publishing_events epe
        LEFT OUTER JOIN entity_versions ev ON (epe.entity_versions_id = ev.id)
        INNER JOIN subjects s ON (epe.published_by = s.id)
      WHERE epe.entities_id = $1
      ORDER BY epe.published_at`,
    [entityInfo.id]
  );
  return ok({
    id: reference.id,
    events: publishEvents.map((it) => {
      const event: PublishingEvent = {
        version: it.version,
        kind: it.kind as PublishingEventKind,
        publishedAt: it.published_at,
        publishedBy: it.published_by,
      };
      return event;
    }),
  });
}
