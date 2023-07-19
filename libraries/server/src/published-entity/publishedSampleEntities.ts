import type {
  AdminSchemaWithMigrations,
  EntitySamplingOptions,
  EntitySamplingPayload,
  ErrorType,
  PromiseResult,
  PublishedEntity,
  PublishedQuery,
  PublishedSchema,
} from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type { DatabaseAdapter, ResolvedAuthKey } from '@dossierhq/database-adapter';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { decodePublishedEntity } from '../EntityCodec.js';
import { sharedSampleEntities } from '../shared-entity/sharedSampleEntities.js';

export async function publishedSampleEntities(
  adminSchema: AdminSchemaWithMigrations,
  publishedSchema: PublishedSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: PublishedQuery | undefined,
  options: EntitySamplingOptions | undefined,
): PromiseResult<
  EntitySamplingPayload<PublishedEntity>,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  function getTotal(
    authKeys: ResolvedAuthKey[],
  ): PromiseResult<number, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
    return databaseAdapter.publishedEntitySearchTotalCount(
      publishedSchema,
      context,
      query,
      authKeys,
    );
  }

  async function sampleEntities(
    offset: number,
    limit: number,
    authKeys: ResolvedAuthKey[],
  ): PromiseResult<PublishedEntity[], typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
    const sampleResult = await databaseAdapter.publishedEntitySampleEntities(
      publishedSchema,
      context,
      query,
      offset,
      limit,
      authKeys,
    );
    if (sampleResult.isError()) return sampleResult;

    const entities = sampleResult.value.map((it) => decodePublishedEntity(adminSchema, it));
    return ok(entities);
  }

  return await sharedSampleEntities(
    authorizationAdapter,
    context,
    query,
    options,
    getTotal,
    sampleEntities,
  );
}
