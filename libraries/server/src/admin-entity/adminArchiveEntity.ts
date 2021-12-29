import type {
  AdminEntityArchivePayload,
  EntityReferenceWithAuthKeys,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import { AdminEntityStatus, notOk, ok } from '@jonasb/datadata-core';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '..';
import { authVerifyAuthorizationKey } from '../Auth';
import * as Db from '../Database';
import type { EntitiesTable } from '../DatabaseTables';

export async function adminArchiveEntity(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  reference: EntityReferenceWithAuthKeys
): PromiseResult<
  AdminEntityArchivePayload,
  ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
> {
  return context.withTransaction(async (context) => {
    const entityInfo = await Db.queryNoneOrOne<
      Pick<
        EntitiesTable,
        | 'id'
        | 'published_entity_versions_id'
        | 'archived'
        | 'updated_at'
        | 'auth_key'
        | 'resolved_auth_key'
      >
    >(
      databaseAdapter,
      context,
      'SELECT e.id, e.published_entity_versions_id, e.archived, e.updated_at, e.auth_key, e.resolved_auth_key FROM entities e WHERE e.uuid = $1',
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

    const {
      id: entityId,
      published_entity_versions_id: publishedVersionId,
      archived,
      updated_at: previousUpdatedAt,
    } = entityInfo;

    if (publishedVersionId) {
      return notOk.BadRequest('Entity is published');
    }
    if (archived) {
      return ok({
        id: reference.id,
        status: AdminEntityStatus.archived,
        effect: 'none',
        updatedAt: previousUpdatedAt,
      }); // no change
    }

    const [{ updated_at: updatedAt }, _] = await Promise.all([
      Db.queryOne<Pick<EntitiesTable, 'updated_at'>>(
        databaseAdapter,
        context,
        `UPDATE entities SET
            archived = TRUE,
            updated_at = NOW(),
            updated = nextval('entities_updated_seq'),
            status = 'archived'
          WHERE id = $1
          RETURNING updated_at`,
        [entityId]
      ),
      Db.queryNone(
        databaseAdapter,
        context,
        "INSERT INTO entity_publishing_events (entities_id, kind, published_by) VALUES ($1, 'archive', $2)",
        [entityId, context.session.subjectInternalId]
      ),
    ]);

    const value: AdminEntityArchivePayload = {
      id: reference.id,
      status: AdminEntityStatus.archived,
      effect: 'archived',
      updatedAt,
    };
    return ok(value);
  });
}
