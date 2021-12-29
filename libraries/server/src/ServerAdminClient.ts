import type {
  AdminClient,
  AdminClientMiddleware,
  AdminClientOperation,
  ContextProvider,
} from '@jonasb/datadata-core';
import {
  AdminClientOperationName,
  assertExhaustive,
  createBaseAdminClient,
  ok,
} from '@jonasb/datadata-core';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '.';
import { adminArchiveEntity } from './admin-entity/adminArchiveEntity';
import { adminCreateEntity } from './admin-entity/adminCreateEntity';
import { adminGetEntities } from './admin-entity/adminGetEntities';
import { adminGetEntity } from './admin-entity/adminGetEntity';
import { adminGetEntityHistory } from './admin-entity/adminGetEntityHistory';
import { adminGetPublishingHistory } from './admin-entity/adminGetPublishingHistory';
import { adminGetTotalCount } from './admin-entity/adminGetTotalCount';
import { adminPublishEntities } from './admin-entity/adminPublishEntities';
import { adminSearchEntities } from './admin-entity/adminSearchEntities';
import { adminUnarchiveEntity } from './admin-entity/adminUnarchiveEntity';
import { adminUnpublishEntities } from './admin-entity/adminUnpublishEntities';
import { adminUpdateEntity } from './admin-entity/adminUpdateEntity';
import { adminUpsertEntity } from './admin-entity/adminUpsertEntity';
import { updateSchemaSpecification } from './Schema';
import type { ServerImpl } from './Server';

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
      case AdminClientOperationName.archiveEntity: {
        const {
          args: [reference],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.archiveEntity>;
        resolve(
          await adminArchiveEntity(databaseAdapter, authorizationAdapter, context, reference)
        );
        break;
      }
      case AdminClientOperationName.createEntity: {
        const {
          args: [entity],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.createEntity>;
        resolve(
          await adminCreateEntity(
            serverImpl.getAdminSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            entity
          )
        );
        break;
      }
      case AdminClientOperationName.getEntities: {
        const {
          args: [references],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.getEntities>;
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
        } = operation as AdminClientOperation<AdminClientOperationName.getEntity>;
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
        } = operation as AdminClientOperation<AdminClientOperationName.getEntityHistory>;
        resolve(
          await adminGetEntityHistory(databaseAdapter, authorizationAdapter, context, reference)
        );
        break;
      }
      case AdminClientOperationName.getPublishingHistory: {
        const {
          args: [reference],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.getPublishingHistory>;
        resolve(
          await adminGetPublishingHistory(databaseAdapter, authorizationAdapter, context, reference)
        );
        break;
      }
      case AdminClientOperationName.getSchemaSpecification: {
        const { resolve } =
          operation as AdminClientOperation<AdminClientOperationName.getSchemaSpecification>;
        const schema = serverImpl.getAdminSchema();
        resolve(ok(schema.spec));
        break;
      }
      case AdminClientOperationName.getTotalCount: {
        const {
          args: [query],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.getTotalCount>;
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
        } = operation as AdminClientOperation<AdminClientOperationName.publishEntities>;
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
      case AdminClientOperationName.searchEntities: {
        const {
          args: [query, paging],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.searchEntities>;
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
        } = operation as AdminClientOperation<AdminClientOperationName.unarchiveEntity>;
        resolve(
          await adminUnarchiveEntity(databaseAdapter, authorizationAdapter, context, reference)
        );
        break;
      }
      case AdminClientOperationName.unpublishEntities: {
        const {
          args: [references],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.unpublishEntities>;
        resolve(
          await adminUnpublishEntities(databaseAdapter, authorizationAdapter, context, references)
        );
        break;
      }
      case AdminClientOperationName.updateEntity: {
        const {
          args: [entity],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.updateEntity>;
        resolve(
          await adminUpdateEntity(
            serverImpl.getAdminSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            entity
          )
        );
        break;
      }
      case AdminClientOperationName.updateSchemaSpecification: {
        const {
          args: [schemaSpec],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.updateSchemaSpecification>;
        const result = await updateSchemaSpecification(databaseAdapter, context, schemaSpec);
        if (result.isOk()) {
          serverImpl.setAdminSchema(result.value.schemaSpecification);
        }
        resolve(result);
        break;
      }
      case AdminClientOperationName.upsertEntity: {
        const {
          args: [entity],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.upsertEntity>;
        resolve(
          await adminUpsertEntity(
            serverImpl.getAdminSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            entity
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
