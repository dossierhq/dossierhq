import type {
  AdminEntity,
  AdminQuery,
  AdminSchema,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type { AuthorizationAdapter, SessionContext } from '..';
import { authResolveAuthorizationKeys } from '../Auth';
import { decodeAdminEntity } from '../EntityCodec';

export async function adminSampleEntities(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: AdminQuery | undefined
): PromiseResult<
  AdminEntity[],
  ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const authKeysResult = await authResolveAuthorizationKeys(
    authorizationAdapter,
    context,
    query?.authKeys
  );
  if (authKeysResult.isError()) {
    return authKeysResult;
  }

  const totalCountResult = await databaseAdapter.adminEntitySearchTotalCount(
    schema,
    context,
    query,
    authKeysResult.value
  );
  if (totalCountResult.isError()) return totalCountResult;

  const limit = 1;
  const offset = getRandomInt(0, totalCountResult.value - limit - 1);

  const sampleResult = await databaseAdapter.adminEntitySampleEntities(
    schema,
    context,
    query,
    offset,
    limit,
    authKeysResult.value
  );
  if (sampleResult.isError()) return sampleResult;

  return ok(sampleResult.value.map((it) => decodeAdminEntity(schema, it)));
}

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
