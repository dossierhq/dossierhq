import {
  AdminClientOperationName,
  SchemaWithMigrations,
  type DossierClient,
  type AdminClientMiddleware,
  type SchemaSpecificationWithMigrations,
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
    schema: SchemaSpecificationWithMigrations,
  ) {
    let migrationsToApply = 0;
    for (const migration of schema.migrations) {
      if (migration.version > lastSchemaVersion) {
        migrationsToApply++;
      }
    }

    if (migrationsToApply > 0) {
      context.logger.info(
        'Clearing cache since there are new schema migrations (previous version=%d, new version=%d, versions with migrations=%d)',
        lastSchemaVersion,
        schema.version,
        migrationsToApply,
      );
      clearCacheDueToSchemaMigrations(mutate);
    }

    lastSchemaVersion = schema.version;
  }

  const middleware: AdminClientMiddleware<TContext> = async (context, operation) => {
    const result = await operation.next();
    if (result.isOk()) {
      assertIsDefined(swrConfig.current);
      const { cache, mutate } = swrConfig.current;
      switch (operation.name) {
        case AdminClientOperationName.archiveEntity: {
          const payload = result.value as OkFromResult<ReturnType<DossierClient['archiveEntity']>>;
          updateCacheEntityInfo(mutate, payload);
          invalidateChangelogEvents(mutate);
          break;
        }
        case AdminClientOperationName.createEntity: {
          const payload = result.value as OkFromResult<ReturnType<DossierClient['createEntity']>>;
          updateCacheEntity(mutate, payload.entity);
          invalidateChangelogEvents(mutate);
          break;
        }
        case AdminClientOperationName.getSchemaSpecification: {
          const args = operation.args as Parameters<DossierClient['getSchemaSpecification']>;
          const payload = result.value as OkFromResult<
            ReturnType<DossierClient['getSchemaSpecification']>
          >;
          if (args[0]?.includeMigrations) {
            handleUpdatedAdminSchema(context, mutate, payload as SchemaSpecificationWithMigrations);
          }
          break;
        }
        case AdminClientOperationName.publishEntities: {
          const payload = result.value as OkFromResult<
            ReturnType<DossierClient['publishEntities']>
          >;
          payload.forEach((it) => {
            updateCacheEntityInfo(mutate, it);
            invalidateChangelogEvents(mutate);
          });
          break;
        }
        case AdminClientOperationName.unarchiveEntity: {
          const payload = result.value as OkFromResult<
            ReturnType<DossierClient['unarchiveEntity']>
          >;
          updateCacheEntityInfo(mutate, payload);
          invalidateChangelogEvents(mutate);
          break;
        }
        case AdminClientOperationName.unpublishEntities: {
          const payload = result.value as OkFromResult<
            ReturnType<DossierClient['unpublishEntities']>
          >;
          payload.forEach((it) => {
            updateCacheEntityInfo(mutate, it);
            invalidateChangelogEvents(mutate);
          });
          break;
        }
        case AdminClientOperationName.updateEntity: {
          const payload = result.value as OkFromResult<ReturnType<DossierClient['updateEntity']>>;
          updateCacheEntity(mutate, payload.entity);
          invalidateChangelogEvents(mutate);
          break;
        }
        case AdminClientOperationName.upsertEntity: {
          const payload = result.value as OkFromResult<ReturnType<DossierClient['upsertEntity']>>;
          updateCacheEntity(mutate, payload.entity);
          invalidateChangelogEvents(mutate);
          break;
        }
        case AdminClientOperationName.updateSchemaSpecification: {
          const args = operation.args as Parameters<DossierClient['updateSchemaSpecification']>;
          const payload = result.value as OkFromResult<
            ReturnType<DossierClient['updateSchemaSpecification']>
          >;
          let schema: SchemaWithMigrations | undefined;
          if (args[1]?.includeMigrations) {
            schema = new SchemaWithMigrations(
              payload.schemaSpecification as SchemaSpecificationWithMigrations,
            );
          }
          updateCacheSchemas(cache, mutate, schema);
          invalidateChangelogEvents(mutate);
          break;
        }
      }
    }
    operation.resolve(result);
  };
  return middleware;
}
