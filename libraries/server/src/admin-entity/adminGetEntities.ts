import type {
  AdminEntity,
  AdminSchema,
  EntityReferenceWithAuthKeys,
  ErrorType,
  PromiseResult,
  Result,
} from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '..';
import { authVerifyAuthorizationKey } from '../Auth';
import * as Db from '../Database';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseTables';
import { decodeAdminEntity } from '../EntityCodec';

export async function adminGetEntities(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  references: EntityReferenceWithAuthKeys[]
): PromiseResult<
  Result<
    AdminEntity,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
  >[],
  ErrorType.Generic
> {
  if (references.length === 0) {
    return ok([]);
  }

  const entitiesMain = await Db.queryMany<
    Pick<
      EntitiesTable,
      | 'uuid'
      | 'type'
      | 'name'
      | 'auth_key'
      | 'resolved_auth_key'
      | 'created_at'
      | 'updated_at'
      | 'status'
    > &
      Pick<EntityVersionsTable, 'version' | 'data'>
  >(
    databaseAdapter,
    context,
    `SELECT e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.data
      FROM entities e, entity_versions ev
      WHERE e.uuid = ANY($1)
      AND e.latest_draft_entity_versions_id = ev.id`,
    [references.map((it) => it.id)]
  );

  async function mapItem(
    reference: EntityReferenceWithAuthKeys,
    entityMain: typeof entitiesMain[0] | undefined
  ): PromiseResult<
    AdminEntity,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
  > {
    if (!entityMain) {
      return notOk.NotFound('No such entity');
    }

    const authResult = await authVerifyAuthorizationKey(
      authorizationAdapter,
      context,
      reference.authKeys,
      { authKey: entityMain.auth_key, resolvedAuthKey: entityMain.resolved_auth_key }
    );
    if (authResult.isError()) {
      return authResult;
    }

    return ok(decodeAdminEntity(schema, entityMain));
  }

  const result: Result<
    AdminEntity,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
  >[] = [];
  for (const reference of references) {
    const entityMain = entitiesMain.find((it) => it.uuid === reference.id);
    result.push(await mapItem(reference, entityMain));
  }

  return ok(result);
}
