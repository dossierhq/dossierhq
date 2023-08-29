import {
  copyEntity,
  type AdminEntity,
  type AdminEntityPublishingPayload,
  type AdminEntityQuery,
  type AdminEntitySharedQuery,
  type AdminSchemaWithMigrations,
  type ChangelogEventQuery,
  type EntityReference,
  type EntitySamplingOptions,
  type EntityVersionReference,
  type Paging,
  type PublishedEntityQuery,
  type PublishedEntitySharedQuery,
} from '@dossierhq/core';
import type { Arguments, Cache, useSWRConfig } from 'swr';

export type ScopedMutator = ReturnType<typeof useSWRConfig>['mutate'];

export const CACHE_KEYS = {
  adminChangelogEvents(query: ChangelogEventQuery | undefined, paging: Paging | undefined) {
    return ['dossierhq/useAdminChangelogEvents', query, paging] as const;
  },
  adminChangelogEventsTotalCount(query: ChangelogEventQuery | undefined) {
    return ['dossierhq/useAdminChangelogEventsTotalCount', query] as const;
  },
  adminEntity(reference: EntityReference | EntityVersionReference) {
    return ['dossierhq/useAdminEntity', reference] as const;
  },
  adminEntitiesSample(
    query: AdminEntitySharedQuery | undefined,
    options: EntitySamplingOptions | undefined,
  ) {
    return ['dossierhq/useAdminEntitiesSample', query, options] as const;
  },
  adminEntities(query: AdminEntityQuery | undefined, paging: Paging | undefined) {
    return ['dossierhq/useAdminEntities', query, paging] as const;
  },
  adminEntitiesTotalCount(query: AdminEntitySharedQuery | undefined) {
    return ['dossierhq/useAdminEntitiesTotalCount', query] as const;
  },
  adminSchema: 'dossierhq/useAdminSchema',
  publishedEntity(reference: EntityReference) {
    return ['dossierhq/usePublishedEntity', reference] as const;
  },
  publishedEntitiesSample(
    query: PublishedEntitySharedQuery | undefined,
    options: EntitySamplingOptions | undefined,
  ) {
    return ['dossierhq/usePublishedEntitiesSample', query, options] as const;
  },
  publishedEntities(query: PublishedEntityQuery | undefined, paging: Paging | undefined) {
    return ['dossierhq/usePublishedEntities', query, paging] as const;
  },
  publishedEntitiesTotalCount(query: PublishedEntitySharedQuery | undefined) {
    return ['dossierhq/usePublishedEntitiesTotalCount', query] as const;
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
