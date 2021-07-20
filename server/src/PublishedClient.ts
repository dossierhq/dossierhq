import type { PublishedClient, PublishedClientOperation } from '@jonasb/datadata-core';
import {
  PublishedClientOperationName,
  assertExhaustive,
  createBasePublishedClient,
} from '@jonasb/datadata-core';
import type { SessionContext } from '.';
import { getEntities, getEntity } from './PublishedEntity';

export function createServerPublishedClient({
  context,
}: {
  context: SessionContext | (() => Promise<SessionContext>);
}): PublishedClient {
  return createBasePublishedClient({ context, pipeline: [terminatingMiddleware] });
}

async function terminatingMiddleware(
  context: SessionContext,
  operation: PublishedClientOperation<PublishedClientOperationName>
): Promise<void> {
  switch (operation.name) {
    case PublishedClientOperationName.getEntities: {
      const {
        args: [references],
        resolve,
      } = operation as PublishedClientOperation<PublishedClientOperationName.getEntities>;
      resolve(
        await getEntities(
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
      resolve(await getEntity(context, reference.id));
      break;
    }
    default:
      assertExhaustive(operation.name);
  }
}
