import type {
  AdminClient,
  AdminClientMiddleware,
  AdminClientOperation,
  AdminEntityCreate,
  AdminEntityUpdate,
  ContextProvider,
} from '@jonasb/datadata-core';
import {
  AdminClientOperationName,
  assertExhaustive,
  createBaseAdminClient,
  ok,
} from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import { adminArchiveEntity } from './admin-entity/adminArchiveEntity.js';
import { adminCreateEntity } from './admin-entity/adminCreateEntity.js';
import { adminGetEntities } from './admin-entity/adminGetEntities.js';
import { adminGetEntity } from './admin-entity/adminGetEntity.js';
import { adminGetEntityHistory } from './admin-entity/adminGetEntityHistory.js';
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
import type { AuthorizationAdapter } from './AuthorizationAdapter.js';
import type { SessionContext } from './Context.js';
import { updateSchemaSpecification } from './Schema.js';
import type { ServerImpl } from './Server.js';

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
    operation: AdminClientOperation
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
          await adminArchiveEntity(databaseAdapter, authorizationAdapter, context, reference)
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
            authorizationAdapter,
            databaseAdapter,
            context,
            entity as AdminEntityCreate,
            options
          )
        );
        break;
      }
      case AdminClientOperationName.getEntities: {
        const {
          args: [references],
          resolve,
        } = operation as AdminClientOperation<typeof AdminClientOperationName.getEntities>;
        resolve(
          await adminGetEntities(
            serverImpl.getAdminSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            references
          )
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
            reference
          )
        );
        break;
      }
      case AdminClientOperationName.getEntityHistory: {
        const {
          args: [reference],
          resolve,
        } = operation as AdminClientOperation<typeof AdminClientOperationName.getEntityHistory>;
        resolve(
          await adminGetEntityHistory(databaseAdapter, authorizationAdapter, context, reference)
        );
        break;
      }
      case AdminClientOperationName.getPublishingHistory: {
        const {
          args: [reference],
          resolve,
        } = operation as AdminClientOperation<typeof AdminClientOperationName.getPublishingHistory>;
        resolve(
          await adminGetPublishingHistory(databaseAdapter, authorizationAdapter, context, reference)
        );
        break;
      }
      case AdminClientOperationName.getSchemaSpecification: {
        const { resolve } = operation as AdminClientOperation<
          typeof AdminClientOperationName.getSchemaSpecification
        >;
        const schema = serverImpl.getAdminSchema();
        resolve(ok(schema.spec));
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
            query
          )
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
            authorizationAdapter,
            databaseAdapter,
            context,
            references
          )
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
            options
          )
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
            paging
          )
        );
        break;
      }
      case AdminClientOperationName.unarchiveEntity: {
        const {
          args: [reference],
          resolve,
        } = operation as AdminClientOperation<typeof AdminClientOperationName.unarchiveEntity>;
        resolve(
          await adminUnarchiveEntity(databaseAdapter, authorizationAdapter, context, reference)
        );
        break;
      }
      case AdminClientOperationName.unpublishEntities: {
        const {
          args: [references],
          resolve,
        } = operation as AdminClientOperation<typeof AdminClientOperationName.unpublishEntities>;
        resolve(
          await adminUnpublishEntities(databaseAdapter, authorizationAdapter, context, references)
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
            authorizationAdapter,
            databaseAdapter,
            context,
            entity as AdminEntityUpdate,
            options
          )
        );
        break;
      }
      case AdminClientOperationName.updateSchemaSpecification: {
        const {
          args: [schemaSpec],
          resolve,
        } = operation as AdminClientOperation<
          typeof AdminClientOperationName.updateSchemaSpecification
        >;
        const result = await updateSchemaSpecification(databaseAdapter, context, schemaSpec);
        if (result.isOk()) {
          serverImpl.setAdminSchema(result.value.schemaSpecification);
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
            authorizationAdapter,
            databaseAdapter,
            context,
            entity,
            options
          )
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
