import type {
  EntityHistory,
  EntityReferenceWithAuthKeys,
  EntityVersionInfo,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '..';
import { authVerifyAuthorizationKey } from '../Auth';
import * as Db from '../Database';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseTables';

export async function adminGetEntityHistory(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  reference: EntityReferenceWithAuthKeys
): PromiseResult<
  EntityHistory,
  ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const entityMain = await Db.queryNoneOrOne<
    Pick<
      EntitiesTable,
      'id' | 'uuid' | 'published_entity_versions_id' | 'auth_key' | 'resolved_auth_key'
    >
  >(
    databaseAdapter,
    context,
    `SELECT id, uuid, published_entity_versions_id, auth_key, resolved_auth_key
      FROM entities e
      WHERE uuid = $1`,
    [reference.id]
  );
  if (!entityMain) {
    return notOk.NotFound('No such entity');
  }

  const authResult = await authVerifyAuthorizationKey(
    authorizationAdapter,
    context,
    reference?.authKeys,
    { authKey: entityMain.auth_key, resolvedAuthKey: entityMain.resolved_auth_key }
  );
  if (authResult.isError()) {
    return authResult;
  }

  const versions = await Db.queryMany<
    Pick<EntityVersionsTable, 'id' | 'version' | 'created_at'> & {
      created_by_uuid: string;
    }
  >(
    databaseAdapter,
    context,
    `SELECT
      ev.id,
      ev.version,
      ev.created_at,
      s.uuid AS created_by_uuid
     FROM entity_versions ev, subjects s
     WHERE ev.entities_id = $1 AND ev.created_by = s.id
     ORDER BY ev.version`,
    [entityMain.id]
  );

  const result: EntityHistory = {
    id: entityMain.uuid,
    versions: versions.map<EntityVersionInfo>((v) => ({
      version: v.version,
      published: v.id === entityMain.published_entity_versions_id,
      createdBy: v.created_by_uuid,
      createdAt: v.created_at,
    })),
  };
  return ok(result);
}
