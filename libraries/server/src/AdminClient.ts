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
import type { DatabaseAdapter, SessionContext } from '.';
import {
  archiveEntity,
  createEntity,
  getEntities,
  getEntity,
  getEntityHistory,
  getPublishingHistory,
  getTotalCount,
  publishEntities,
  searchEntities,
  unarchiveEntity,
  unpublishEntities,
  updateEntity,
  upsertEntity,
} from './EntityAdmin';
import { updateSchemaSpecification } from './Schema';
import type { ServerImpl } from './Server';

export function createServerAdminClient({
  context,
  databaseAdapter,
  serverImpl,
  middleware,
}: {
  context: SessionContext | ContextProvider<SessionContext>;
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
        resolve(await archiveEntity(databaseAdapter, context, reference.id));
        break;
      }
      case AdminClientOperationName.createEntity: {
        const {
          args: [entity],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.createEntity>;
        resolve(await createEntity(serverImpl.getSchema(), databaseAdapter, context, entity));
        break;
      }
      case AdminClientOperationName.getEntities: {
        const {
          args: [references],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.getEntities>;
        resolve(
          await getEntities(
            serverImpl.getSchema(),
            databaseAdapter,
            context,
            references.map(({ id }) => id)
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
          await getEntity(
            serverImpl.getSchema(),
            databaseAdapter,
            context,
            reference.id,
            'version' in reference ? reference.version : null
          )
        );
        break;
      }
      case AdminClientOperationName.getEntityHistory: {
        const {
          args: [reference],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.getEntityHistory>;
        resolve(await getEntityHistory(databaseAdapter, context, reference.id));
        break;
      }
      case AdminClientOperationName.getPublishingHistory: {
        const {
          args: [reference],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.getPublishingHistory>;
        resolve(await getPublishingHistory(databaseAdapter, context, reference.id));
        break;
      }
      case AdminClientOperationName.getSchemaSpecification: {
        const { resolve } =
          operation as AdminClientOperation<AdminClientOperationName.getSchemaSpecification>;
        const schema = serverImpl.getSchema();
        resolve(ok(schema.spec));
        break;
      }
      case AdminClientOperationName.getTotalCount: {
        const {
          args: [query],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.getTotalCount>;
        resolve(await getTotalCount(serverImpl.getSchema(), databaseAdapter, context, query));
        break;
      }
      case AdminClientOperationName.publishEntities: {
        const {
          args: [references],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.publishEntities>;
        resolve(
          await publishEntities(serverImpl.getSchema(), databaseAdapter, context, references)
        );
        break;
      }
      case AdminClientOperationName.searchEntities: {
        const {
          args: [query, paging],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.searchEntities>;
        resolve(
          await searchEntities(serverImpl.getSchema(), databaseAdapter, context, query, paging)
        );
        break;
      }
      case AdminClientOperationName.unarchiveEntity: {
        const {
          args: [reference],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.unarchiveEntity>;
        resolve(await unarchiveEntity(databaseAdapter, context, reference.id));
        break;
      }
      case AdminClientOperationName.unpublishEntities: {
        const {
          args: [references],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.unpublishEntities>;
        resolve(
          await unpublishEntities(
            databaseAdapter,
            context,
            references.map(({ id }) => id)
          )
        );
        break;
      }
      case AdminClientOperationName.updateEntity: {
        const {
          args: [entity],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.updateEntity>;
        resolve(await updateEntity(serverImpl.getSchema(), databaseAdapter, context, entity));
        break;
      }
      case AdminClientOperationName.updateSchemaSpecification: {
        const {
          args: [schemaSpec],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.updateSchemaSpecification>;
        const result = await updateSchemaSpecification(databaseAdapter, context, schemaSpec);
        if (result.isOk()) {
          serverImpl.setSchema(result.value.schemaSpecification);
        }
        resolve(result);
        break;
      }
      case AdminClientOperationName.upsertEntity: {
        const {
          args: [entity],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.upsertEntity>;
        resolve(await upsertEntity(serverImpl.getSchema(), databaseAdapter, context, entity));
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
