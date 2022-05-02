import type { AdminClient, AdminClientMiddleware, ClientContext } from '@jonasb/datadata-core';
import { AdminClientOperationName, AdminSchema, assertIsDefined } from '@jonasb/datadata-core';
import type { OkFromPromiseResult } from '@jonasb/datadata-core/lib/cjs/ErrorResult';
import type { RefObject } from 'react';
import type { Cache, ScopedMutator } from 'swr/dist/types';
import { updateCacheEntity, updateCacheSchemas } from './CacheUtils';

export type SwrConfigRef = RefObject<{ cache: Cache; mutate: ScopedMutator }>;

export function createCachingAdminMiddleware<TContext extends ClientContext>(
  swrConfig: SwrConfigRef
) {
  const middleware: AdminClientMiddleware<TContext> = async (context, operation) => {
    const result = await operation.next();
    if (result.isOk()) {
      assertIsDefined(swrConfig.current);
      const { cache, mutate } = swrConfig.current;
      switch (operation.name) {
        case AdminClientOperationName.createEntity: {
          const createPayload = result.value as OkFromPromiseResult<
            ReturnType<AdminClient['createEntity']>
          >;
          updateCacheEntity(mutate, createPayload.entity);
          break;
        }
        case AdminClientOperationName.updateEntity: {
          const updatePayload = result.value as OkFromPromiseResult<
            ReturnType<AdminClient['updateEntity']>
          >;
          updateCacheEntity(mutate, updatePayload.entity);
          break;
        }
        case AdminClientOperationName.updateSchemaSpecification: {
          const updatePayload = result.value as OkFromPromiseResult<
            ReturnType<AdminClient['updateSchemaSpecification']>
          >;
          const adminSchema = new AdminSchema(updatePayload.schemaSpecification);
          updateCacheSchemas(cache, mutate, adminSchema);
          break;
        }
      }
    }
    operation.resolve(result);
  };
  return middleware;
}
