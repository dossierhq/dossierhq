import {
  copyEntity,
  type ChangelogEventQuery,
  type Entity,
  type EntityPublishingPayload,
  type EntityQuery,
  type EntityReference,
  type EntitySamplingOptions,
  type EntitySharedQuery,
  type EntityVersionReference,
  type Paging,
  type PublishedEntityQuery,
  type PublishedEntitySharedQuery,
  type SchemaWithMigrations,
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
    query: EntitySharedQuery | undefined,
    options: EntitySamplingOptions | undefined,
  ) {
    return ['dossierhq/useAdminEntitiesSample', query, options] as const;
  },
  adminEntities(query: EntityQuery | undefined, paging: Paging | undefined) {
    return ['dossierhq/useAdminEntities', query, paging] as const;
  },
  adminEntitiesTotalCount(query: EntitySharedQuery | undefined) {
    return ['dossierhq/useAdminEntitiesTotalCount', query] as const;
  },
  schema: 'dossierhq/useAdminSchema',
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
  schema: SchemaWithMigrations | undefined,
) {
  const hasAdmin = !!cache.get(CACHE_KEYS.schema);
  const hasPublished = !!cache.get(CACHE_KEYS.publishedSchema);
  if (hasAdmin || hasPublished) {
    if (hasAdmin) {
      mutate(CACHE_KEYS.schema, schema);
    }
    if (hasPublished) {
      const publishedSchema = schema?.toPublishedSchema();
      mutate(CACHE_KEYS.publishedSchema, publishedSchema);
    }
  }
}

export function updateCacheEntity<T extends Entity<string, object> = Entity>(
  mutate: ScopedMutator,
  entity: T,
) {
  const key = CACHE_KEYS.adminEntity({ id: entity.id });
  mutate(key, entity);
}

export function updateCacheEntityInfo<TEffect>(
  mutate: ScopedMutator,
  payload: EntityPublishingPayload<TEffect>,
) {
  const key = CACHE_KEYS.adminEntity({ id: payload.id });
  mutate(key, (entity: Entity | undefined) => {
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
