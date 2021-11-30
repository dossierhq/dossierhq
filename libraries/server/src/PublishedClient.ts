import type {
  ContextProvider,
  PublishedClient,
  PublishedClientMiddleware,
  PublishedClientOperation,
} from '@jonasb/datadata-core';
import {
  assertExhaustive,
  createBasePublishedClient,
  ok,
  PublishedClientOperationName,
} from '@jonasb/datadata-core';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '.';
import { getEntities, getEntity, getTotalCount, searchEntities } from './PublishedEntity';
import type { ServerImpl } from './Server';

export function createServerPublishedClient({
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
  middleware: PublishedClientMiddleware<SessionContext>[];
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
            databaseAdapter,
            context,
            references.map(({ id }) => id)
          )
        );
        break;
      }
      case PublishedClientOperationName.getEntity: {
        const {
          args: [reference, options],
          resolve,
        } = operation as PublishedClientOperation<PublishedClientOperationName.getEntity>;
        resolve(
          await getEntity(
            serverImpl.getSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            reference,
            options
          )
        );
        break;
      }
      case PublishedClientOperationName.getSchemaSpecification: {
        const { resolve } =
          operation as PublishedClientOperation<PublishedClientOperationName.getSchemaSpecification>;
        const schema = serverImpl.getSchema();
        resolve(ok(schema.spec));
        break;
      }
      case PublishedClientOperationName.getTotalCount: {
        const {
          args: [query, options],
          resolve,
        } = operation as PublishedClientOperation<PublishedClientOperationName.getTotalCount>;
        resolve(
          await getTotalCount(
            serverImpl.getSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            query,
            options
          )
        );
        break;
      }
      case PublishedClientOperationName.searchEntities: {
        const {
          args: [query, paging, options],
          resolve,
        } = operation as PublishedClientOperation<PublishedClientOperationName.searchEntities>;
        resolve(
          await searchEntities(
            serverImpl.getSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            query,
            paging,
            options
          )
        );
        break;
      }
      default:
        assertExhaustive(operation.name);
    }
  }

  return createBasePublishedClient<SessionContext>({
    context,
    pipeline: [...middleware, terminatingMiddleware],
  });
}
