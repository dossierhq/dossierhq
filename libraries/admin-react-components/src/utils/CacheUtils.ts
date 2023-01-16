import type {
  AdminEntity,
  AdminEntityPublishingPayload,
  AdminQuery,
  AdminSchema,
  AdminSearchQuery,
  EntityReference,
  EntitySamplingOptions,
  EntityVersionReference,
  Paging,
  PublishedQuery,
  PublishedSearchQuery,
} from '@dossierhq/core';
import { copyEntity } from '@dossierhq/core';
import type { Cache, useSWRConfig } from 'swr';

export type ScopedMutator = ReturnType<typeof useSWRConfig>['mutate'];

export const CACHE_KEYS = {
  adminEntity(reference: EntityReference | EntityVersionReference) {
    return ['datadata/useAdminEntity', reference] as const;
  },
  adminEntityHistory(reference: EntityReference) {
    return ['datadata/useAdminEntityHistory', reference] as const;
  },
  adminPublishingHistory(reference: EntityReference) {
    return ['datadata/useAdminPublishingHistory', reference] as const;
  },
  adminSampleEntities(query: AdminQuery | undefined, options: EntitySamplingOptions | undefined) {
    return ['datadata/useAdminSampleEntities', query, options] as const;
  },
  adminSearchEntities(query: AdminSearchQuery | undefined, paging: Paging | undefined) {
    return ['datadata/useAdminSearchEntities', query, paging] as const;
  },
  adminTotalCount(query: AdminQuery | undefined) {
    return ['datadata/useAdminTotalCount', query] as const;
  },
  adminSchema: 'datadata/useAdminSchema',
  publishedEntity(reference: EntityReference) {
    return ['datadata/usePublishedEntity', reference] as const;
  },
  publishedSampleEntities(
    query: PublishedQuery | undefined,
    options: EntitySamplingOptions | undefined
  ) {
    return ['datadata/usePublishedSampleEntities', query, options] as const;
  },
  publishedSearchEntities(query: PublishedSearchQuery | undefined, paging: Paging | undefined) {
    return ['datadata/usePublishedSearchEntities', query, paging] as const;
  },
  publishedTotalCount(query: PublishedQuery | undefined) {
    return ['datadata/usePublishedTotalCount', query] as const;
  },
  publishedSchema: 'datadata/usePublishedSchema',
};

export function updateCacheSchemas(cache: Cache, mutate: ScopedMutator, adminSchema: AdminSchema) {
  const hasAdmin = !!cache.get(CACHE_KEYS.adminSchema);
  const hasPublished = !!cache.get(CACHE_KEYS.publishedSchema);
  if (hasAdmin || hasPublished) {
    if (hasAdmin) {
      mutate(CACHE_KEYS.adminSchema, adminSchema);
    }
    if (hasPublished) {
      const publishedSchema = adminSchema.toPublishedSchema();
      mutate(CACHE_KEYS.publishedSchema, publishedSchema);
    }
  }
}

export function updateCacheEntity<T extends AdminEntity<string, object> = AdminEntity>(
  mutate: ScopedMutator,
  entity: T
) {
  const key = CACHE_KEYS.adminEntity({ id: entity.id });
  mutate(key, entity);
}

export function updateCacheEntityInfo<TEffect>(
  mutate: ScopedMutator,
  payload: AdminEntityPublishingPayload<TEffect>
) {
  const key = CACHE_KEYS.adminEntity({ id: payload.id });
  mutate(key, (entity: AdminEntity | undefined) => {
    if (!entity) return entity;
    return copyEntity(entity, { info: { status: payload.status, updatedAt: payload.updatedAt } });
  });
}

export function invalidateEntityHistory(mutate: ScopedMutator, entityId: string) {
  const key = CACHE_KEYS.adminEntityHistory({ id: entityId });
  mutate(key);
}

export function invalidatePublishingHistory(mutate: ScopedMutator, entityId: string) {
  const key = CACHE_KEYS.adminPublishingHistory({ id: entityId });
  mutate(key);
}
