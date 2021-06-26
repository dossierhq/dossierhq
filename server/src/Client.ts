import type { AdminClient, AdminClientOperation } from '@datadata/core';
import { AdminClientOperationName, createBaseAdminClient } from '@datadata/core';
import type { SessionContext } from '..';
import { getEntity } from './EntityAdmin';

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
  if (isOperation(operation, AdminClientOperationName.GetEntity)) {
    const { reference } = operation.args;
    operation.resolve(
      await getEntity(context, reference.id, 'version' in reference ? reference.version : null)
    );
  }
}

function isOperation<TName extends AdminClientOperationName>(
  operation: AdminClientOperation<TName>,
  name: TName
): operation is AdminClientOperation<TName> {
  return operation.name === name;
}
