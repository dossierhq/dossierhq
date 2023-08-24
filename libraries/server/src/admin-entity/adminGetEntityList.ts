import type {
  AdminEntity,
  AdminSchemaWithMigrations,
  EntityReference,
  ErrorType,
  PromiseResult,
  Result,
} from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabaseAdminEntityGetOnePayload,
} from '@dossierhq/database-adapter';
import { authVerifyAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { decodeAdminEntity } from '../EntityCodec.js';

export async function adminGetEntityList(
  schema: AdminSchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  references: EntityReference[],
): PromiseResult<
  Result<
    AdminEntity,
    | typeof ErrorType.BadRequest
    | typeof ErrorType.NotFound
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  >[],
  typeof ErrorType.Generic
> {
  if (references.length === 0) {
    return ok([]);
  }

  const entityInfoResult = await databaseAdapter.adminEntityGetMultiple(context, references);
  if (entityInfoResult.isError()) return entityInfoResult;

  const result: Result<
    AdminEntity,
    | typeof ErrorType.BadRequest
    | typeof ErrorType.NotFound
    | typeof ErrorType.NotAuthorized
    | typeof ErrorType.Generic
  >[] = [];
  for (const reference of references) {
    const entityMain = entityInfoResult.value.find((it) => it.id === reference.id);
    result.push(await mapItem(schema, authorizationAdapter, context, reference, entityMain));
  }

  return ok(result);
}

async function mapItem(
  schema: AdminSchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  reference: EntityReference,
  values: DatabaseAdminEntityGetOnePayload | undefined,
): PromiseResult<
  AdminEntity,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotFound
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  if (!values) {
    return notOk.NotFound('No such entity');
  }

  const authResult = await authVerifyAuthorizationKey(authorizationAdapter, context, {
    authKey: values.authKey,
    resolvedAuthKey: values.resolvedAuthKey,
  });
  if (authResult.isError()) return authResult;

  return decodeAdminEntity(schema, values);
}
