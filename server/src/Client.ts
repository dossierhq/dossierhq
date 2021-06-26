import type { AdminClient, AdminClientOperation } from '@datadata/core';
import { AdminClientOperationName, createBaseAdminClient } from '@datadata/core';
import type { SessionContext } from '..';
import { getEntities, getEntity, getTotalCount } from './EntityAdmin';

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
    case AdminClientOperationName.GetEntity: {
      const {
        args: { reference },
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.GetEntity>;
      resolve(
        await getEntity(context, reference.id, 'version' in reference ? reference.version : null)
      );
      break;
    }
    case AdminClientOperationName.GetEntities: {
      const {
        args: { references },
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
        args: { query },
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.GetTotalCount>;
      resolve(await getTotalCount(context, query));
      break;
    }
    default:
      assertExhaustive(operation.name);
  }
}

function assertExhaustive(param: never) {
  throw new Error(`Invalid exhaustiveness check: ${param}`);
}
