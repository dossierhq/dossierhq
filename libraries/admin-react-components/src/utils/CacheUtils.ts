import type { AdminSchemaSpecification } from '@jonasb/datadata-core';
import { AdminSchema, PublishedSchema } from '@jonasb/datadata-core';
import type { Cache } from 'swr';
import type { ScopedMutator } from 'swr/dist/types';

export const CACHE_KEYS = {
  adminSchema: 'datadata/admin/useSchema',
  publishedSchema: 'datadata/published/useSchema',
};

export function updateCacheSchemas(
  cache: Cache,
  mutate: ScopedMutator,
  adminSchemaSpec: AdminSchemaSpecification
) {
  const hasAdmin = !!cache.get(CACHE_KEYS.adminSchema);
  const hasPublished = !!cache.get(CACHE_KEYS.publishedSchema);
  if (hasAdmin || hasPublished) {
    const adminSchema = new AdminSchema(adminSchemaSpec);

    if (hasAdmin) {
      mutate(CACHE_KEYS.adminSchema, adminSchema);
    }
    if (hasPublished) {
      const publishedSchema = new PublishedSchema(adminSchema.toPublishedSchema());
      mutate(CACHE_KEYS.publishedSchema, publishedSchema);
    }
  }
}
