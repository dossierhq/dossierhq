import type { AdminClient, AdminClientOperation } from '@datadata/core';
import { AdminClientOperationName, createBaseAdminClient } from '@datadata/core';
import type { SessionContext } from '..';
import { createEntity, getEntities, getEntity, getTotalCount, searchEntities } from './EntityAdmin';

export function createServerClient({
  resolveContext,
}: {
  resolveContext: () => Promise<SessionContext>;
}): AdminClient {
  return createBaseAdminClient({ resolveContext, pipeline: [terminatingMiddleware] });
}

async function terminatingMiddleware(
  context: SessionContext,
  operation: AdminClientOperation<AdminClientOperationName>
): Promise<void> {
  switch (operation.name) {
    case AdminClientOperationName.CreateEntity: {
      const {
        args: [entity],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.CreateEntity>;
      resolve(await createEntity(context, entity));
      break;
    }
    case AdminClientOperationName.GetEntity: {
      const {
        args: [reference],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.GetEntity>;
      resolve(
        await getEntity(context, reference.id, 'version' in reference ? reference.version : null)
      );
      break;
    }
    case AdminClientOperationName.GetEntities: {
      const {
        args: [references],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.GetEntities>;
      resolve(
        await getEntities(
          context,
          references.map(({ id }) => id)
        )
      );
      break;
    }
    case AdminClientOperationName.GetTotalCount: {
      const {
        args: [query],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.GetTotalCount>;
      resolve(await getTotalCount(context, query));
      break;
    }
    case AdminClientOperationName.SearchEntities: {
      const {
        args: [query, paging],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.SearchEntities>;
      resolve(await searchEntities(context, query, paging));
      break;
    }
    default:
      assertExhaustive(operation.name);
  }
}

function assertExhaustive(param: never) {
  throw new Error(`Invalid exhaustiveness check: ${param}`);
}
