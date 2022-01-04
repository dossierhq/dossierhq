import type {
  AdminEntity,
  AdminSchema,
  EntityReference,
  ErrorType,
  PromiseResult,
  Result,
} from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdapter,
  DatabaseAdminEntityGetOnePayload,
} from '@jonasb/datadata-database-adapter';
import type { AuthorizationAdapter, SessionContext } from '..';
import { authVerifyAuthorizationKey } from '../Auth';
import { decodeAdminEntity } from '../EntityCodec';

export async function adminGetEntities(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  references: EntityReference[]
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

  const entityInfoResult = await databaseAdapter.adminEntityGetMultiple(context, references);
  if (entityInfoResult.isError()) {
    return entityInfoResult;
  }

  const result: Result<
    AdminEntity,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
  >[] = [];
  for (const reference of references) {
    const entityMain = entityInfoResult.value.find((it) => it.id === reference.id);
    result.push(await mapItem(schema, authorizationAdapter, context, reference, entityMain));
  }

  return ok(result);
}

async function mapItem(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  reference: EntityReference,
  values: DatabaseAdminEntityGetOnePayload | undefined
): PromiseResult<
  AdminEntity,
  ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
> {
  if (!values) {
    return notOk.NotFound('No such entity');
  }

  const authResult = await authVerifyAuthorizationKey(authorizationAdapter, context, {
    authKey: values.authKey,
    resolvedAuthKey: values.resolvedAuthKey,
  });
  if (authResult.isError()) {
    return authResult;
  }

  return ok(decodeAdminEntity(schema, values));
}
