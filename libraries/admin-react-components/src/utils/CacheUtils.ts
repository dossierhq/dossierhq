import type {
  AdminEntity,
  AdminEntityPublishingPayload,
  AdminSchema,
  EntityReference,
  EntityVersionReference,
} from '@jonasb/datadata-core';
import { copyEntity, PublishedSchema } from '@jonasb/datadata-core';
import type { Cache } from 'swr';
import type { ScopedMutator } from 'swr/dist/types';

export const CACHE_KEYS = {
  adminEntity(reference: EntityReference | EntityVersionReference) {
    return ['datadata/useAdminEntity', JSON.stringify(reference)];
  },
  adminEntityHistory(reference: EntityReference) {
    return ['datadata/useAdminEntityHistory', reference];
  },
  adminPublishingHistory(reference: EntityReference) {
    return ['datadata/useAdminPublishingHistory', reference];
  },
  adminSchema: 'datadata/useAdminSchema',
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
      const publishedSchema = new PublishedSchema(adminSchema.toPublishedSchema());
      mutate(CACHE_KEYS.publishedSchema, publishedSchema);
    }
  }
}

export function updateCacheEntity(mutate: ScopedMutator, entity: AdminEntity) {
  const key = CACHE_KEYS.adminEntity({ id: entity.id });
  mutate(key, entity);
}

export function updateCacheEntityInfo<TEffect>(
  mutate: ScopedMutator<AdminEntity>,
  payload: AdminEntityPublishingPayload<TEffect>
) {
  const key = CACHE_KEYS.adminEntity({ id: payload.id });
  mutate(key, (entity) => {
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
