import type {
  AdminEntitySharedQuery,
  EntitySamplingOptions,
  EntitySamplingPayload,
  ErrorType,
  PromiseResult,
  PublishedEntitySharedQuery,
  Result,
} from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type { ResolvedAuthKey } from '@dossierhq/database-adapter';
import { authResolveAuthorizationKeys } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { Randomizer } from '../utils/Randomizer.js';

const MAX_SEED = 2147483647;
const SAMPLING_DEFAULT_COUNT = 25; //TODO move to constants or make configurable?

export async function sharedSampleEntities<
  TQuery extends AdminEntitySharedQuery | PublishedEntitySharedQuery,
  TEntity,
>(
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  query: TQuery | undefined,
  options: EntitySamplingOptions | undefined,
  getTotal: (
    authKeys: ResolvedAuthKey[],
  ) => PromiseResult<number, typeof ErrorType.BadRequest | typeof ErrorType.Generic>,
  sampleEntities: (
    offset: number,
    limit: number,
    authKeys: ResolvedAuthKey[],
  ) => PromiseResult<
    Result<TEntity, typeof ErrorType.BadRequest | typeof ErrorType.Generic>[],
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >,
): PromiseResult<
  EntitySamplingPayload<TEntity>,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  const seed = options?.seed ?? Math.floor(Math.random() * MAX_SEED);
  // We expect a seed as an integer, but the user might have used Math.random() which returns a float (0..1).
  const normalizedSeed = seed >= 0 && seed < 1 ? Math.floor(seed * MAX_SEED) : seed;

  // Check authorization
  const authKeysResult = await authResolveAuthorizationKeys(
    authorizationAdapter,
    context,
    query?.authKeys,
  );
  if (authKeysResult.isError()) return authKeysResult;

  // Get total count
  const totalCountResult = await getTotal(authKeysResult.value);
  if (totalCountResult.isError()) return totalCountResult;
  const totalCount = totalCountResult.value;

  if (totalCount === 0) {
    return ok({ seed, totalCount, items: [] });
  }

  // Calculate offset/limit
  const randomizer = new Randomizer(normalizedSeed);
  const limit = options?.count ?? SAMPLING_DEFAULT_COUNT;
  const offset = limit >= totalCount ? 0 : randomizer.randomInt(totalCount - limit - 1);

  // Get entities
  const sampleResult = await sampleEntities(offset, limit, authKeysResult.value);
  if (sampleResult.isError()) return sampleResult;
  const entitiesWithResultItems = sampleResult.value;

  // Filter out errors
  //TODO should we silently ignore errors for sample?
  const entities: TEntity[] = [];
  for (const entity of entitiesWithResultItems) {
    if (entity.isOk()) {
      entities.push(entity.value);
    }
  }

  // Shuffle entities
  randomizer.shuffleArray(entities);

  //
  return ok({ seed, totalCount, items: entities });
}
