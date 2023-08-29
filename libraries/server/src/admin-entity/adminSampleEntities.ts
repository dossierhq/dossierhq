import type {
  AdminEntity,
  AdminEntitySharedQuery,
  AdminSchemaWithMigrations,
  EntitySamplingOptions,
  EntitySamplingPayload,
  ErrorType,
  PromiseResult,
  Result,
} from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type { DatabaseAdapter, ResolvedAuthKey } from '@dossierhq/database-adapter';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { decodeAdminEntity } from '../EntityCodec.js';
import { sharedSampleEntities } from '../shared-entity/sharedSampleEntities.js';

export async function adminSampleEntities(
  schema: AdminSchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: AdminEntitySharedQuery | undefined,
  options: EntitySamplingOptions | undefined,
): PromiseResult<
  EntitySamplingPayload<AdminEntity>,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  function getTotal(
    authKeys: ResolvedAuthKey[],
  ): PromiseResult<number, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
    return databaseAdapter.adminEntitySearchTotalCount(schema, context, query, authKeys);
  }

  async function sampleEntities(
    offset: number,
    limit: number,
    authKeys: ResolvedAuthKey[],
  ): PromiseResult<
    Result<AdminEntity, typeof ErrorType.BadRequest | typeof ErrorType.Generic>[],
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  > {
    const sampleResult = await databaseAdapter.adminEntitySampleEntities(
      schema,
      context,
      query,
      offset,
      limit,
      authKeys,
    );
    if (sampleResult.isError()) return sampleResult;

    const entities = sampleResult.value.map((it) => decodeAdminEntity(schema, it));
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
