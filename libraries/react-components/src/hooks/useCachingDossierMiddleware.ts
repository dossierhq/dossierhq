import {
  DossierClientOperationName,
  SchemaWithMigrations,
  type ClientContext,
  type DossierClient,
  type DossierClientMiddleware,
  type OkFromResult,
  type SchemaSpecificationWithMigrations,
} from '@dossierhq/core';
import { useMemo, useRef, type RefObject } from 'react';
import { useSWRConfig, type Cache } from 'swr';
import { assertIsDefined } from '../utils/AssertUtils.js';
import {
  clearCacheDueToSchemaMigrations,
  invalidateChangelogEvents,
  updateCacheEntity,
  updateCacheEntityInfo,
  updateCacheSchemas,
  type ScopedMutator,
} from '../utils/CacheUtils.js';

type SwrConfigRef = RefObject<{ cache: Cache; mutate: ScopedMutator }>;

export function useCachingDossierMiddleware() {
  const { cache, mutate } = useSWRConfig();
  const swrConfigRef = useRef({ cache, mutate });
  swrConfigRef.current = { cache, mutate };
  const middleware = useMemo(() => createCachingDossierMiddleware(swrConfigRef), []);

  return middleware;
}

function createCachingDossierMiddleware<TContext extends ClientContext>(swrConfig: SwrConfigRef) {
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

  const middleware: DossierClientMiddleware<TContext> = async (context, operation) => {
    const result = await operation.next();
    if (result.isOk()) {
      assertIsDefined(swrConfig.current);
      const { cache, mutate } = swrConfig.current;
      switch (operation.name) {
        case DossierClientOperationName.archiveEntity: {
          const payload = result.value as OkFromResult<ReturnType<DossierClient['archiveEntity']>>;
          updateCacheEntityInfo(mutate, payload);
          invalidateChangelogEvents(mutate);
          break;
        }
        case DossierClientOperationName.createEntity: {
          const payload = result.value as OkFromResult<ReturnType<DossierClient['createEntity']>>;
          updateCacheEntity(mutate, payload.entity);
          invalidateChangelogEvents(mutate);
          break;
        }
        case DossierClientOperationName.getSchemaSpecification: {
          const args = operation.args as Parameters<DossierClient['getSchemaSpecification']>;
          const payload = result.value as OkFromResult<
            ReturnType<DossierClient['getSchemaSpecification']>
          >;
          if (args[0]?.includeMigrations) {
            handleUpdatedAdminSchema(context, mutate, payload as SchemaSpecificationWithMigrations);
          }
          break;
        }
        case DossierClientOperationName.publishEntities: {
          const payload = result.value as OkFromResult<
            ReturnType<DossierClient['publishEntities']>
          >;
          payload.forEach((it) => {
            updateCacheEntityInfo(mutate, it);
            invalidateChangelogEvents(mutate);
          });
          break;
        }
        case DossierClientOperationName.unarchiveEntity: {
          const payload = result.value as OkFromResult<
            ReturnType<DossierClient['unarchiveEntity']>
          >;
          updateCacheEntityInfo(mutate, payload);
          invalidateChangelogEvents(mutate);
          break;
        }
        case DossierClientOperationName.unpublishEntities: {
          const payload = result.value as OkFromResult<
            ReturnType<DossierClient['unpublishEntities']>
          >;
          payload.forEach((it) => {
            updateCacheEntityInfo(mutate, it);
            invalidateChangelogEvents(mutate);
          });
          break;
        }
        case DossierClientOperationName.updateEntity: {
          const payload = result.value as OkFromResult<ReturnType<DossierClient['updateEntity']>>;
          updateCacheEntity(mutate, payload.entity);
          invalidateChangelogEvents(mutate);
          break;
        }
        case DossierClientOperationName.upsertEntity: {
          const payload = result.value as OkFromResult<ReturnType<DossierClient['upsertEntity']>>;
          updateCacheEntity(mutate, payload.entity);
          invalidateChangelogEvents(mutate);
          break;
        }
        case DossierClientOperationName.updateSchemaSpecification: {
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
