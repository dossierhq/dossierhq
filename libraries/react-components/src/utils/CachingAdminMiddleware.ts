import {
  AdminClientOperationName,
  AdminSchemaWithMigrations,
  type AdminClient,
  type AdminClientMiddleware,
  type AdminSchemaSpecificationWithMigrations,
  type ClientContext,
  type OkFromResult,
} from '@dossierhq/core';
import type { RefObject } from 'react';
import { useMemo, useRef } from 'react';
import type { Cache } from 'swr';
import { useSWRConfig } from 'swr';
import { assertIsDefined } from './AssertUtils.js';
import type { ScopedMutator } from './CacheUtils.js';
import {
  clearCacheDueToSchemaMigrations,
  invalidateChangelogEvents,
  updateCacheEntity,
  updateCacheEntityInfo,
  updateCacheSchemas,
} from './CacheUtils.js';

type SwrConfigRef = RefObject<{ cache: Cache; mutate: ScopedMutator }>;

export function useCachingAdminMiddleware() {
  const { cache, mutate } = useSWRConfig();
  const swrConfigRef = useRef({ cache, mutate });
  swrConfigRef.current = { cache, mutate };
  const middleware = useMemo(() => createCachingAdminMiddleware(swrConfigRef), []);

  return middleware;
}

function createCachingAdminMiddleware<TContext extends ClientContext>(swrConfig: SwrConfigRef) {
  let lastSchemaVersion = 0;

  function handleUpdatedAdminSchema(
    context: TContext,
    mutate: ScopedMutator,
    adminSchema: AdminSchemaSpecificationWithMigrations,
  ) {
    let migrationsToApply = 0;
    for (const migration of adminSchema.migrations) {
      if (migration.version > lastSchemaVersion) {
        migrationsToApply++;
      }
    }

    if (migrationsToApply > 0) {
      context.logger.info(
        'Clearing cache since there are new schema migrations (previous version=%d, new version=%d, versions with migrations=%d)',
        lastSchemaVersion,
        adminSchema.version,
        migrationsToApply,
      );
      clearCacheDueToSchemaMigrations(mutate);
    }

    lastSchemaVersion = adminSchema.version;
  }

  const middleware: AdminClientMiddleware<TContext> = async (context, operation) => {
    const result = await operation.next();
    if (result.isOk()) {
      assertIsDefined(swrConfig.current);
      const { cache, mutate } = swrConfig.current;
      switch (operation.name) {
        case AdminClientOperationName.archiveEntity: {
          const payload = result.value as OkFromResult<ReturnType<AdminClient['archiveEntity']>>;
          updateCacheEntityInfo(mutate, payload);
          invalidateChangelogEvents(mutate);
          break;
        }
        case AdminClientOperationName.createEntity: {
          const payload = result.value as OkFromResult<ReturnType<AdminClient['createEntity']>>;
          updateCacheEntity(mutate, payload.entity);
          invalidateChangelogEvents(mutate);
          break;
        }
        case AdminClientOperationName.getSchemaSpecification: {
          const args = operation.args as Parameters<AdminClient['getSchemaSpecification']>;
          const payload = result.value as OkFromResult<
            ReturnType<AdminClient['getSchemaSpecification']>
          >;
          if (args[0]?.includeMigrations) {
            handleUpdatedAdminSchema(
              context,
              mutate,
              payload as AdminSchemaSpecificationWithMigrations,
            );
          }
          break;
        }
        case AdminClientOperationName.publishEntities: {
          const payload = result.value as OkFromResult<ReturnType<AdminClient['publishEntities']>>;
          payload.forEach((it) => {
            updateCacheEntityInfo(mutate, it);
            invalidateChangelogEvents(mutate);
          });
          break;
        }
        case AdminClientOperationName.unarchiveEntity: {
          const payload = result.value as OkFromResult<ReturnType<AdminClient['unarchiveEntity']>>;
          updateCacheEntityInfo(mutate, payload);
          invalidateChangelogEvents(mutate);
          break;
        }
        case AdminClientOperationName.unpublishEntities: {
          const payload = result.value as OkFromResult<
            ReturnType<AdminClient['unpublishEntities']>
          >;
          payload.forEach((it) => {
            updateCacheEntityInfo(mutate, it);
            invalidateChangelogEvents(mutate);
          });
          break;
        }
        case AdminClientOperationName.updateEntity: {
          const payload = result.value as OkFromResult<ReturnType<AdminClient['updateEntity']>>;
          updateCacheEntity(mutate, payload.entity);
          invalidateChangelogEvents(mutate);
          break;
        }
        case AdminClientOperationName.upsertEntity: {
          const payload = result.value as OkFromResult<ReturnType<AdminClient['upsertEntity']>>;
          updateCacheEntity(mutate, payload.entity);
          invalidateChangelogEvents(mutate);
          break;
        }
        case AdminClientOperationName.updateSchemaSpecification: {
          const args = operation.args as Parameters<AdminClient['updateSchemaSpecification']>;
          const payload = result.value as OkFromResult<
            ReturnType<AdminClient['updateSchemaSpecification']>
          >;
          let adminSchema: AdminSchemaWithMigrations | undefined;
          if (args[1]?.includeMigrations) {
            adminSchema = new AdminSchemaWithMigrations(
              payload.schemaSpecification as AdminSchemaSpecificationWithMigrations,
            );
          }
          updateCacheSchemas(cache, mutate, adminSchema);
          invalidateChangelogEvents(mutate);
          break;
        }
      }
    }
    operation.resolve(result);
  };
  return middleware;
}
