import type {
  EntitySamplingOptions,
  EntitySamplingPayload,
  ErrorType,
  PromiseResult,
  PublishedEntity,
  PublishedQuery,
  PublishedSchema,
} from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type { AuthorizationAdapter, ResolvedAuthKey, SessionContext } from '..';
import { decodePublishedEntity } from '../EntityCodec';
import { sharedSampleEntities } from '../shared-entity/sharedSampleEntities';

export async function publishedSampleEntities(
  schema: PublishedSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: PublishedQuery | undefined,
  options: EntitySamplingOptions | undefined
): PromiseResult<
  EntitySamplingPayload<PublishedEntity>,
  ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
> {
  function getTotal(
    authKeys: ResolvedAuthKey[]
  ): PromiseResult<number, ErrorType.BadRequest | ErrorType.Generic> {
    return databaseAdapter.publishedEntitySearchTotalCount(schema, context, query, authKeys);
  }

  async function sampleEntities(
    offset: number,
    limit: number,
    authKeys: ResolvedAuthKey[]
  ): PromiseResult<PublishedEntity[], ErrorType.BadRequest | ErrorType.Generic> {
    const sampleResult = await databaseAdapter.publishedEntitySampleEntities(
      schema,
      context,
      query,
      offset,
      limit,
      authKeys
    );
    if (sampleResult.isError()) return sampleResult;

    const entities = sampleResult.value.map((it) => decodePublishedEntity(schema, it));
    return ok(entities);
  }

  return await sharedSampleEntities(
    authorizationAdapter,
    context,
    query,
    options,
    getTotal,
    sampleEntities
  );
}
