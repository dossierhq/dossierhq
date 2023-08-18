import {
  copyEntity,
  type AdminEntity,
  type AdminEntityPublishingPayload,
  type AdminQuery,
  type AdminSchemaWithMigrations,
  type AdminSearchQuery,
  type ChangelogQuery,
  type EntityReference,
  type EntitySamplingOptions,
  type EntityVersionReference,
  type Paging,
  type PublishedQuery,
  type PublishedSearchQuery,
} from '@dossierhq/core';
import type { Arguments, Cache, useSWRConfig } from 'swr';

export type ScopedMutator = ReturnType<typeof useSWRConfig>['mutate'];

export const CACHE_KEYS = {
  adminChangelogEvents(query: ChangelogQuery | undefined, paging: Paging | undefined) {
    return ['dossierhq/useAdminChangelogEvents', query, paging] as const;
  },
  adminChangelogTotalCount(query: ChangelogQuery | undefined) {
    return ['dossierhq/useAdminChangelogTotalCount', query] as const;
  },
  adminEntity(reference: EntityReference | EntityVersionReference) {
    return ['dossierhq/useAdminEntity', reference] as const;
  },
  adminSampleEntities(query: AdminQuery | undefined, options: EntitySamplingOptions | undefined) {
    return ['dossierhq/useAdminSampleEntities', query, options] as const;
  },
  adminSearchEntities(query: AdminSearchQuery | undefined, paging: Paging | undefined) {
    return ['dossierhq/useAdminSearchEntities', query, paging] as const;
  },
  adminTotalCount(query: AdminQuery | undefined) {
    return ['dossierhq/useAdminTotalCount', query] as const;
  },
  adminSchema: 'dossierhq/useAdminSchema',
  publishedEntity(reference: EntityReference) {
    return ['dossierhq/usePublishedEntity', reference] as const;
  },
  publishedSampleEntities(
    query: PublishedQuery | undefined,
    options: EntitySamplingOptions | undefined,
  ) {
    return ['dossierhq/usePublishedSampleEntities', query, options] as const;
  },
  publishedSearchEntities(query: PublishedSearchQuery | undefined, paging: Paging | undefined) {
    return ['dossierhq/usePublishedSearchEntities', query, paging] as const;
  },
  publishedTotalCount(query: PublishedQuery | undefined) {
    return ['dossierhq/usePublishedTotalCount', query] as const;
  },
  publishedSchema: 'dossierhq/usePublishedSchema',
};

function geInitialCacheKey(key: Arguments): string | null {
  if (typeof key === 'string') {
    return key;
  }
  if (Array.isArray(key) && typeof key[0] === 'string') {
    return key[0];
  }
  return null;
}

export function clearCacheDueToSchemaMigrations(mutate: ScopedMutator) {
  mutate((key) => {
    const initialKey = geInitialCacheKey(key);
    const shouldMutate = initialKey && initialKey.startsWith('dossierhq');
    return shouldMutate;
  });
}

export function updateCacheSchemas(
  cache: Cache,
  mutate: ScopedMutator,
  adminSchema: AdminSchemaWithMigrations | undefined,
) {
  const hasAdmin = !!cache.get(CACHE_KEYS.adminSchema);
  const hasPublished = !!cache.get(CACHE_KEYS.publishedSchema);
  if (hasAdmin || hasPublished) {
    if (hasAdmin) {
      mutate(CACHE_KEYS.adminSchema, adminSchema);
    }
    if (hasPublished) {
      const publishedSchema = adminSchema?.toPublishedSchema();
      mutate(CACHE_KEYS.publishedSchema, publishedSchema);
    }
  }
}

export function updateCacheEntity<T extends AdminEntity<string, object> = AdminEntity>(
  mutate: ScopedMutator,
  entity: T,
) {
  const key = CACHE_KEYS.adminEntity({ id: entity.id });
  mutate(key, entity);
}

export function updateCacheEntityInfo<TEffect>(
  mutate: ScopedMutator,
  payload: AdminEntityPublishingPayload<TEffect>,
) {
  const key = CACHE_KEYS.adminEntity({ id: payload.id });
  mutate(key, (entity: AdminEntity | undefined) => {
    if (!entity) return entity;
    return copyEntity(entity, { info: { status: payload.status, updatedAt: payload.updatedAt } });
  });
}

export function invalidateChangelogEvents(mutate: ScopedMutator) {
  const keyString = CACHE_KEYS.adminChangelogEvents(undefined, undefined)[0];

  mutate((key) => {
    const initialKey = geInitialCacheKey(key);
    const shouldMutate = initialKey === keyString;
    return shouldMutate;
  });
}
