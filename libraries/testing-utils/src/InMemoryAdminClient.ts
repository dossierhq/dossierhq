import type {
  AdminClient,
  AdminClientMiddleware,
  AdminClientOperation,
} from '@jonasb/datadata-core';
import {
  AdminClientOperationName,
  assertExhaustive,
  createBaseAdminClient,
  ok,
} from '@jonasb/datadata-core';
import { InMemoryAdmin } from './InMemoryAdmin';
import type { InMemorySessionContext } from './InMemoryServer';

const {
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
} = InMemoryAdmin;

export function createInMemoryAdminClient<TContext extends InMemorySessionContext>({
  context,
  middleware,
}: {
  context: TContext | (() => Promise<TContext>);
  middleware?: AdminClientMiddleware<TContext>[];
}): AdminClient {
  return createBaseAdminClient<TContext>({
    context,
    pipeline: [...(middleware ?? []), terminatingMiddleware],
  });
}

async function terminatingMiddleware(
  context: InMemorySessionContext,
  operation: AdminClientOperation
): Promise<void> {
  switch (operation.name) {
    case AdminClientOperationName.archiveEntity: {
      const {
        args: [reference],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.archiveEntity>;
      resolve(await archiveEntity(context, reference.id));
      break;
    }
    case AdminClientOperationName.createEntity: {
      const {
        args: [entity],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.createEntity>;
      resolve(await createEntity(context, entity));
      break;
    }
    case AdminClientOperationName.getEntities: {
      const {
        args: [references],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.getEntities>;
      resolve(
        await getEntities(
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
        await getEntity(context, reference.id, 'version' in reference ? reference.version : null)
      );
      break;
    }
    case AdminClientOperationName.getEntityHistory: {
      const {
        args: [reference],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.getEntityHistory>;
      resolve(await getEntityHistory(context, reference.id));
      break;
    }
    case AdminClientOperationName.getPublishingHistory: {
      const {
        args: [reference],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.getPublishingHistory>;
      resolve(await getPublishingHistory(context, reference.id));
      break;
    }
    case AdminClientOperationName.getSchemaSpecification: {
      const { resolve } =
        operation as AdminClientOperation<AdminClientOperationName.getSchemaSpecification>;
      resolve(ok(context.server.schema.spec));
      break;
    }
    case AdminClientOperationName.getTotalCount: {
      const {
        args: [query],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.getTotalCount>;
      resolve(await getTotalCount(context, query));
      break;
    }
    case AdminClientOperationName.publishEntities: {
      const {
        args: [references],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.publishEntities>;
      resolve(await publishEntities(context, references));
      break;
    }
    case AdminClientOperationName.searchEntities: {
      const {
        args: [query, paging],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.searchEntities>;
      resolve(await searchEntities(context, query, paging));
      break;
    }
    case AdminClientOperationName.unarchiveEntity: {
      const {
        args: [reference],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.unarchiveEntity>;
      resolve(await unarchiveEntity(context, reference.id));
      break;
    }
    case AdminClientOperationName.unpublishEntities: {
      const {
        args: [references],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.unpublishEntities>;
      resolve(await unpublishEntities(context, references));
      break;
    }
    case AdminClientOperationName.updateEntity: {
      const {
        args: [entity],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.updateEntity>;
      resolve(await updateEntity(context, entity));
      break;
    }
    case AdminClientOperationName.upsertEntity: {
      const {
        args: [entity],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.upsertEntity>;
      resolve(await upsertEntity(context, entity));
      break;
    }
    default:
      assertExhaustive(operation.name);
  }
}
