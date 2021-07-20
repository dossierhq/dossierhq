import type { PublishedClient, PublishedClientOperation } from '@jonasb/datadata-core';
import {
  PublishedClientOperationName,
  assertExhaustive,
  createBasePublishedClient,
} from '@jonasb/datadata-core';
import { getEntities, getEntity } from './InMemoryPublished';
import type { InMemorySessionContext } from './InMemoryServer';

export function createInMemoryPublishedClient({
  context,
}: {
  context: InMemorySessionContext | (() => Promise<InMemorySessionContext>);
}): PublishedClient {
  return createBasePublishedClient({ context, pipeline: [terminatingMiddleware] });
}

async function terminatingMiddleware(
  context: InMemorySessionContext,
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
