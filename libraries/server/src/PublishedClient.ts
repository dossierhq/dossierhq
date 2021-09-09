import type { PublishedClient, PublishedClientOperation } from '@jonasb/datadata-core';
import {
  assertExhaustive,
  createBasePublishedClient,
  PublishedClientOperationName,
} from '@jonasb/datadata-core';
import type { SessionContext } from '.';
import { getEntities, getEntity } from './PublishedEntity';
import type { ServerImpl } from './Server';

export function createServerPublishedClient({
  context,
  serverImpl,
}: {
  context: SessionContext | (() => Promise<SessionContext>);
  serverImpl: ServerImpl;
}): PublishedClient {
  async function terminatingMiddleware(
    context: SessionContext,
    operation: PublishedClientOperation
  ): Promise<void> {
    switch (operation.name) {
      case PublishedClientOperationName.getEntities: {
        const {
          args: [references],
          resolve,
        } = operation as PublishedClientOperation<PublishedClientOperationName.getEntities>;
        resolve(
          await getEntities(
            serverImpl.getSchema(),
            context,
            references.map(({ id }) => id)
          )
        );
        break;
      }
      case PublishedClientOperationName.getEntity: {
        const {
          args: [reference],
          resolve,
        } = operation as PublishedClientOperation<PublishedClientOperationName.getEntity>;
        resolve(await getEntity(serverImpl.getSchema(), context, reference.id));
        break;
      }
      default:
        assertExhaustive(operation.name);
    }
  }

  return createBasePublishedClient({ context, pipeline: [terminatingMiddleware] });
}
