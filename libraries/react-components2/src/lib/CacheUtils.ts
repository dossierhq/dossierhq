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
  getChangelogEvents(query: ChangelogEventQuery | undefined, paging: Paging | undefined) {
    return ['dossierhq-2/getChangelogEvents', query, paging] as const;
  },
  getChangelogEventsTotalCount(query: ChangelogEventQuery | undefined) {
    return ['dossierhq-2/getChangelogEventsTotalCount', query] as const;
  },
  getEntity(reference: EntityReference | EntityVersionReference) {
    return ['dossierhq-2/getEntity', reference] as const;
  },
  getEntitiesSample(
    query: EntitySharedQuery | undefined,
    options: EntitySamplingOptions | undefined,
  ) {
    return ['dossierhq-2/getEntitiesSample', query, options] as const;
  },
  getEntities(query: EntityQuery | undefined, paging: Paging | undefined) {
    return ['dossierhq-2/getEntities', query, paging] as const;
  },
  getEntitiesTotalCount(query: EntitySharedQuery | undefined) {
    return ['dossierhq-2/getEntitiesTotalCount', query] as const;
  },
  getSchemaSpecification: 'dossierhq-2/getSchemaSpecification',
  publishedGetEntity(reference: EntityReference) {
    return ['dossierhq-2/published/getEntity', reference] as const;
  },
  publishedGetEntitiesSample(
    query: PublishedEntitySharedQuery | undefined,
    options: EntitySamplingOptions | undefined,
  ) {
    return ['dossierhq-2/published/getEntitiesSample', query, options] as const;
  },
  publishedGetEntities(query: PublishedEntityQuery | undefined, paging: Paging | undefined) {
    return ['dossierhq-2/published/entities', query, paging] as const;
  },
  publishedGetEntitiesTotalCount(query: PublishedEntitySharedQuery | undefined) {
    return ['dossierhq-2/published/getEntitiesTotalCount', query] as const;
  },
  publishedSchema: 'dossierhq-2/published/getSchemaSpecification',
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
  const hasAdmin = !!cache.get(CACHE_KEYS.getSchemaSpecification);
  const hasPublished = !!cache.get(CACHE_KEYS.publishedSchema);
  if (hasAdmin || hasPublished) {
    if (hasAdmin) {
      mutate(CACHE_KEYS.getSchemaSpecification, schema);
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
  const key = CACHE_KEYS.getEntity({ id: entity.id });
  mutate(key, entity);
}

export function updateCacheEntityInfo<TEffect>(
  mutate: ScopedMutator,
  payload: EntityPublishingPayload<TEffect>,
) {
  const key = CACHE_KEYS.getEntity({ id: payload.id });
  mutate(key, (entity: Entity | undefined) => {
    if (!entity) return entity;
    return copyEntity(entity, { info: { status: payload.status, updatedAt: payload.updatedAt } });
  });
}

export function removeCacheEntity(mutate: ScopedMutator, reference: EntityReference) {
  const key = CACHE_KEYS.getEntity(reference);
  mutate(key, undefined);
}

export function invalidateChangelogEvents(mutate: ScopedMutator) {
  const keyString = CACHE_KEYS.getChangelogEvents(undefined, undefined)[0];

  mutate((key) => {
    const initialKey = geInitialCacheKey(key);
    const shouldMutate = initialKey === keyString;
    return shouldMutate;
  });
}
