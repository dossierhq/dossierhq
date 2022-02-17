import type {
  AdminEntity,
  AdminQuery,
  AdminSchema,
  EntitySamplingOptions,
  EntitySamplingPayload,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type { AuthorizationAdapter, SessionContext } from '..';
import { authResolveAuthorizationKeys } from '../Auth';
import { decodeAdminEntity } from '../EntityCodec';
import { Randomizer } from '../utils/Randomizer';

const samplingDefaultCount = 25;

export async function adminSampleEntities(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: AdminQuery | undefined,
  options: EntitySamplingOptions | undefined
): PromiseResult<
  EntitySamplingPayload<AdminEntity>,
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
  const totalCount = totalCountResult.value;

  const seed = options?.seed ?? Math.floor(Math.random() * 2147483647);
  const randomizer = new Randomizer(seed);

  const limit = options?.count ?? samplingDefaultCount;
  const offset = limit >= totalCount ? 0 : randomizer.randomInt(totalCount - limit - 1);

  const sampleResult = await databaseAdapter.adminEntitySampleEntities(
    schema,
    context,
    query,
    offset,
    limit,
    authKeysResult.value
  );
  if (sampleResult.isError()) return sampleResult;

  const entities = sampleResult.value.map((it) => decodeAdminEntity(schema, it));

  randomizer.shuffleArray(entities);

  return ok({ seed, totalCount, items: entities });
}
