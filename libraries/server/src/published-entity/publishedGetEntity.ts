import type {
  EntityReferenceWithAuthKeys,
  ErrorType,
  PromiseResult,
  PublishedEntity,
  PublishedSchema,
} from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '..';
import { authVerifyAuthorizationKey } from '../Auth';
import * as Db from '../Database';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseTables';
import { decodePublishedEntity } from '../EntityCodec';

export async function publishedGetEntity(
  schema: PublishedSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  reference: EntityReferenceWithAuthKeys
): PromiseResult<
  PublishedEntity,
  ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const entityMain = await Db.queryNoneOrOne<
    Pick<
      EntitiesTable,
      'uuid' | 'type' | 'name' | 'auth_key' | 'resolved_auth_key' | 'created_at'
    > &
      Pick<EntityVersionsTable, 'data'>
  >(
    databaseAdapter,
    context,
    `SELECT e.uuid, e.type, e.name, e,auth_key, e.resolved_auth_key, e.created_at, ev.data
      FROM entities e, entity_versions ev
      WHERE e.uuid = $1
      AND e.published_entity_versions_id = ev.id`,
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

  const entity = decodePublishedEntity(schema, entityMain);

  return ok(entity);
}
