import type {
  AdminClient,
  AdminClientMiddleware,
  ClientContext,
  OkFromResult,
} from '@jonasb/datadata-core';
import { AdminClientOperationName, AdminSchema, assertIsDefined } from '@jonasb/datadata-core';
import type { RefObject } from 'react';
import type { Cache, ScopedMutator } from 'swr/dist/types';
import {
  invalidateEntityHistory,
  invalidatePublishingHistory,
  updateCacheEntity,
  updateCacheEntityInfo,
  updateCacheSchemas,
} from './CacheUtils';

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
        case AdminClientOperationName.archiveEntity: {
          const payload = result.value as OkFromResult<ReturnType<AdminClient['archiveEntity']>>;
          updateCacheEntityInfo(mutate, payload);
          invalidatePublishingHistory(mutate, payload.id);
          break;
        }
        case AdminClientOperationName.createEntity: {
          const payload = result.value as OkFromResult<ReturnType<AdminClient['createEntity']>>;
          updateCacheEntity(mutate, payload.entity);
          invalidateEntityHistory(mutate, payload.entity.id);
          break;
        }
        case AdminClientOperationName.publishEntities: {
          const payload = result.value as OkFromResult<ReturnType<AdminClient['publishEntities']>>;
          payload.forEach((it) => {
            updateCacheEntityInfo(mutate, it);
            invalidatePublishingHistory(mutate, it.id);
          });
          break;
        }
        case AdminClientOperationName.unarchiveEntity: {
          const payload = result.value as OkFromResult<ReturnType<AdminClient['unarchiveEntity']>>;
          updateCacheEntityInfo(mutate, payload);
          invalidatePublishingHistory(mutate, payload.id);
          break;
        }
        case AdminClientOperationName.unpublishEntities: {
          const payload = result.value as OkFromResult<
            ReturnType<AdminClient['unpublishEntities']>
          >;
          payload.forEach((it) => {
            updateCacheEntityInfo(mutate, it);
            invalidatePublishingHistory(mutate, it.id);
          });
          break;
        }
        case AdminClientOperationName.updateEntity: {
          const payload = result.value as OkFromResult<ReturnType<AdminClient['updateEntity']>>;
          updateCacheEntity(mutate, payload.entity);
          invalidateEntityHistory(mutate, payload.entity.id);
          break;
        }
        case AdminClientOperationName.upsertEntity: {
          const payload = result.value as OkFromResult<ReturnType<AdminClient['upsertEntity']>>;
          updateCacheEntity(mutate, payload.entity);
          invalidateEntityHistory(mutate, payload.entity.id);
          break;
        }
        case AdminClientOperationName.updateSchemaSpecification: {
          const payload = result.value as OkFromResult<
            ReturnType<AdminClient['updateSchemaSpecification']>
          >;
          const adminSchema = new AdminSchema(payload.schemaSpecification);
          updateCacheSchemas(cache, mutate, adminSchema);
          break;
        }
      }
    }
    operation.resolve(result);
  };
  return middleware;
}
