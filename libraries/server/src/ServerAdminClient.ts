import {
  AdminClientOperationName,
  assertExhaustive,
  createBaseAdminClient,
  ok,
  type AdminClient,
  type AdminClientMiddleware,
  type AdminClientOperation,
  type AdminEntityCreate,
  type AdminEntityUpdate,
  type AdminEntityUpsert,
  type AdminSchemaSpecificationWithMigrations,
  type ContextProvider,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import type { AuthorizationAdapter } from './AuthorizationAdapter.js';
import type { SessionContext } from './Context.js';
import type { ServerImpl } from './Server.js';
import { adminArchiveEntity } from './admin-entity/adminArchiveEntity.js';
import { adminCreateEntity } from './admin-entity/adminCreateEntity.js';
import { adminGetEntity } from './admin-entity/adminGetEntity.js';
import { adminGetEntityHistory } from './admin-entity/adminGetEntityHistory.js';
import { adminGetEntityList } from './admin-entity/adminGetEntityList.js';
import { adminGetPublishingHistory } from './admin-entity/adminGetPublishingHistory.js';
import { adminGetTotalCount } from './admin-entity/adminGetTotalCount.js';
import { adminPublishEntities } from './admin-entity/adminPublishEntities.js';
import { adminSampleEntities } from './admin-entity/adminSampleEntities.js';
import { adminSearchEntities } from './admin-entity/adminSearchEntities.js';
import { adminUnarchiveEntity } from './admin-entity/adminUnarchiveEntity.js';
import { adminUnpublishEntities } from './admin-entity/adminUnpublishEntities.js';
import { adminUpdateEntity } from './admin-entity/adminUpdateEntity.js';
import { adminUpsertEntity } from './admin-entity/adminUpsertEntity.js';
import { acquireAdvisoryLock } from './advisory-lock/acquireAdvisoryLock.js';
import { releaseAdvisoryLock } from './advisory-lock/releaseAdvisoryLock.js';
import { renewAdvisoryLock } from './advisory-lock/renewAdvisoryLock.js';
import { eventGetChangelogEvents } from './event/eventGetChangelogEvents.js';
import { eventGetChangelogEventsTotalCount } from './event/eventGetChangelogEventsTotalCount.js';
import { schemaUpdateSpecification } from './schema/schemaUpdateSpecification.js';

export function createServerAdminClient({
  context,
  authorizationAdapter,
  databaseAdapter,
  serverImpl,
  middleware,
}: {
  context: SessionContext | ContextProvider<SessionContext>;
  authorizationAdapter: AuthorizationAdapter;
  databaseAdapter: DatabaseAdapter;
  serverImpl: ServerImpl;
  middleware: AdminClientMiddleware<SessionContext>[];
}): AdminClient {
  async function terminatingMiddleware(
    context: SessionContext,
    operation: AdminClientOperation,
  ): Promise<void> {
    switch (operation.name) {
      case AdminClientOperationName.acquireAdvisoryLock: {
        const {
          args: [name, options],
          resolve,
        } = operation as AdminClientOperation<typeof AdminClientOperationName.acquireAdvisoryLock>;
        resolve(await acquireAdvisoryLock(databaseAdapter, context, name, options));
        break;
      }
      case AdminClientOperationName.archiveEntity: {
        const {
          args: [reference],
          resolve,
        } = operation as AdminClientOperation<typeof AdminClientOperationName.archiveEntity>;
        resolve(
          await adminArchiveEntity(databaseAdapter, authorizationAdapter, context, reference),
        );
        break;
      }
      case AdminClientOperationName.createEntity: {
        const {
          args: [entity, options],
          resolve,
        } = operation as AdminClientOperation<typeof AdminClientOperationName.createEntity>;
        resolve(
          await adminCreateEntity(
            serverImpl.getAdminSchema(),
            serverImpl.getPublishedSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            entity as AdminEntityCreate,
            options,
          ),
        );
        break;
      }
      case AdminClientOperationName.getChangelogEvents: {
        const {
          args: [query, paging],
          resolve,
        } = operation as AdminClientOperation<typeof AdminClientOperationName.getChangelogEvents>;
        resolve(
          await eventGetChangelogEvents(
            authorizationAdapter,
            databaseAdapter,
            context,
            query,
            paging,
          ),
        );
        break;
      }
      case AdminClientOperationName.getChangelogEventsTotalCount: {
        const {
          args: [query],
          resolve,
        } = operation as AdminClientOperation<
          typeof AdminClientOperationName.getChangelogEventsTotalCount
        >;
        resolve(
          await eventGetChangelogEventsTotalCount(
            authorizationAdapter,
            databaseAdapter,
            context,
            query,
          ),
        );
        break;
      }
      case AdminClientOperationName.getEntity: {
        const {
          args: [reference],
          resolve,
        } = operation as AdminClientOperation<typeof AdminClientOperationName.getEntity>;
        resolve(
          await adminGetEntity(
            serverImpl.getAdminSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            reference,
          ),
        );
        break;
      }
      case AdminClientOperationName.getEntityList: {
        const {
          args: [references],
          resolve,
        } = operation as AdminClientOperation<typeof AdminClientOperationName.getEntityList>;
        resolve(
          await adminGetEntityList(
            serverImpl.getAdminSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            references,
          ),
        );
        break;
      }
      case AdminClientOperationName.getEntityHistory: {
        const {
          args: [reference],
          resolve,
        } = operation as AdminClientOperation<typeof AdminClientOperationName.getEntityHistory>;
        resolve(
          await adminGetEntityHistory(databaseAdapter, authorizationAdapter, context, reference),
        );
        break;
      }
      case AdminClientOperationName.getPublishingHistory: {
        const {
          args: [reference],
          resolve,
        } = operation as AdminClientOperation<typeof AdminClientOperationName.getPublishingHistory>;
        resolve(
          await adminGetPublishingHistory(
            databaseAdapter,
            authorizationAdapter,
            context,
            reference,
          ),
        );
        break;
      }
      case AdminClientOperationName.getSchemaSpecification: {
        const {
          args: [options],
          resolve,
        } = operation as AdminClientOperation<
          typeof AdminClientOperationName.getSchemaSpecification
        >;
        const schema = serverImpl.getAdminSchema();
        const includeMigrations = options?.includeMigrations ?? false;
        if (!includeMigrations) {
          const { migrations: _, ...spec } = schema.spec;
          resolve(ok(spec));
        } else {
          resolve(ok(schema.spec));
        }
        break;
      }
      case AdminClientOperationName.getTotalCount: {
        const {
          args: [query],
          resolve,
        } = operation as AdminClientOperation<typeof AdminClientOperationName.getTotalCount>;
        resolve(
          await adminGetTotalCount(
            serverImpl.getAdminSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            query,
          ),
        );
        break;
      }
      case AdminClientOperationName.publishEntities: {
        const {
          args: [references],
          resolve,
        } = operation as AdminClientOperation<typeof AdminClientOperationName.publishEntities>;
        resolve(
          await adminPublishEntities(
            serverImpl.getAdminSchema(),
            serverImpl.getPublishedSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            references,
          ),
        );
        break;
      }
      case AdminClientOperationName.releaseAdvisoryLock: {
        const {
          args: [name, handle],
          resolve,
        } = operation as AdminClientOperation<typeof AdminClientOperationName.releaseAdvisoryLock>;
        resolve(await releaseAdvisoryLock(databaseAdapter, context, name, handle));
        break;
      }
      case AdminClientOperationName.renewAdvisoryLock: {
        const {
          args: [name, handle],
          resolve,
        } = operation as AdminClientOperation<typeof AdminClientOperationName.renewAdvisoryLock>;
        resolve(await renewAdvisoryLock(databaseAdapter, context, name, handle));
        break;
      }
      case AdminClientOperationName.sampleEntities: {
        const {
          args: [query, options],
          resolve,
        } = operation as AdminClientOperation<typeof AdminClientOperationName.sampleEntities>;
        resolve(
          await adminSampleEntities(
            serverImpl.getAdminSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            query,
            options,
          ),
        );
        break;
      }
      case AdminClientOperationName.searchEntities: {
        const {
          args: [query, paging],
          resolve,
        } = operation as AdminClientOperation<typeof AdminClientOperationName.searchEntities>;
        resolve(
          await adminSearchEntities(
            serverImpl.getAdminSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            query,
            paging,
          ),
        );
        break;
      }
      case AdminClientOperationName.unarchiveEntity: {
        const {
          args: [reference],
          resolve,
        } = operation as AdminClientOperation<typeof AdminClientOperationName.unarchiveEntity>;
        resolve(
          await adminUnarchiveEntity(databaseAdapter, authorizationAdapter, context, reference),
        );
        break;
      }
      case AdminClientOperationName.unpublishEntities: {
        const {
          args: [references],
          resolve,
        } = operation as AdminClientOperation<typeof AdminClientOperationName.unpublishEntities>;
        resolve(
          await adminUnpublishEntities(databaseAdapter, authorizationAdapter, context, references),
        );
        break;
      }
      case AdminClientOperationName.updateEntity: {
        const {
          args: [entity, options],
          resolve,
        } = operation as AdminClientOperation<typeof AdminClientOperationName.updateEntity>;
        resolve(
          await adminUpdateEntity(
            serverImpl.getAdminSchema(),
            serverImpl.getPublishedSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            entity as AdminEntityUpdate,
            options,
          ),
        );
        break;
      }
      case AdminClientOperationName.updateSchemaSpecification: {
        const {
          args: [schemaSpec, options],
          resolve,
        } = operation as AdminClientOperation<
          typeof AdminClientOperationName.updateSchemaSpecification
        >;
        const includeMigrations = options?.includeMigrations ?? false;
        const result = await schemaUpdateSpecification(databaseAdapter, context, schemaSpec);
        if (result.isOk()) {
          serverImpl.setAdminSchema(result.value.schemaSpecification);

          if (!includeMigrations) {
            const { migrations: _, ...spec } = result.value.schemaSpecification;
            result.value.schemaSpecification = spec as AdminSchemaSpecificationWithMigrations;
          }
        }
        resolve(result);
        break;
      }
      case AdminClientOperationName.upsertEntity: {
        const {
          args: [entity, options],
          resolve,
        } = operation as AdminClientOperation<typeof AdminClientOperationName.upsertEntity>;
        resolve(
          await adminUpsertEntity(
            serverImpl.getAdminSchema(),
            serverImpl.getPublishedSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            entity as AdminEntityUpsert,
            options,
          ),
        );
        break;
      }
      default:
        assertExhaustive(operation.name);
    }
  }

  return createBaseAdminClient<SessionContext>({
    context,
    pipeline: [...middleware, terminatingMiddleware],
  });
}
