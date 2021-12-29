import type {
  AdminEntityUnarchivePayload,
  EntityReferenceWithAuthKeys,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import { AdminEntityStatus, notOk, ok } from '@jonasb/datadata-core';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '..';
import { authVerifyAuthorizationKey } from '../Auth';
import * as Db from '../Database';
import type { EntitiesTable } from '../DatabaseTables';
import { resolveEntityStatus } from '../EntityCodec';

export async function adminUnarchiveEntity(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  reference: EntityReferenceWithAuthKeys
): PromiseResult<
  AdminEntityUnarchivePayload,
  ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.NotFound | ErrorType.Generic
> {
  return context.withTransaction(async (context) => {
    const entityInfo = await Db.queryNoneOrOne<
      Pick<
        EntitiesTable,
        'id' | 'never_published' | 'updated_at' | 'status' | 'auth_key' | 'resolved_auth_key'
      >
    >(
      databaseAdapter,
      context,
      `SELECT id, never_published, updated_at, status, auth_key, resolved_auth_key
       FROM entities WHERE uuid = $1`,
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
      never_published: neverPublished,
      updated_at: previousUpdatedAt,
    } = entityInfo;
    const result: AdminEntityUnarchivePayload = {
      id: reference.id,
      status: resolveEntityStatus(entityInfo.status),
      effect: 'none',
      updatedAt: previousUpdatedAt,
    };

    if (result.status === AdminEntityStatus.archived) {
      result.status = neverPublished ? AdminEntityStatus.draft : AdminEntityStatus.withdrawn;
      result.effect = 'unarchived';

      const [{ updated_at: updatedAt }, _] = await Promise.all([
        Db.queryOne<Pick<EntitiesTable, 'updated_at'>>(
          databaseAdapter,
          context,
          `UPDATE entities SET
            archived = FALSE,
            updated_at = NOW(),
            updated = nextval('entities_updated_seq'),
            status = $1
          WHERE id = $2
          RETURNING updated_at`,
          [result.status, entityId]
        ),
        Db.queryNone(
          databaseAdapter,
          context,
          "INSERT INTO entity_publishing_events (entities_id, kind, published_by) VALUES ($1, 'unarchive', $2)",
          [entityId, context.session.subjectInternalId]
        ),
      ]);
      result.updatedAt = updatedAt;
    }

    return ok(result);
  });
}
