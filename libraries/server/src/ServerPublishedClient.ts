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
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type { AuthorizationAdapter, SessionContext } from '.';
import { publishedGetEntities } from './published-entity/publishedGetEntities';
import { publishedGetEntity } from './published-entity/publishedGetEntity';
import { publishedGetTotalCount } from './published-entity/publishedGetTotalCount';
import { publishedSearchEntities } from './published-entity/publishedSearchEntities';
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
          await publishedGetEntities(
            serverImpl.getPublishedSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            references
          )
        );
        break;
      }
      case PublishedClientOperationName.getEntity: {
        const {
          args: [reference],
          resolve,
        } = operation as PublishedClientOperation<PublishedClientOperationName.getEntity>;
        resolve(
          await publishedGetEntity(
            serverImpl.getPublishedSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            reference
          )
        );
        break;
      }
      case PublishedClientOperationName.getSchemaSpecification: {
        const { resolve } =
          operation as PublishedClientOperation<PublishedClientOperationName.getSchemaSpecification>;
        const schema = serverImpl.getPublishedSchema();
        resolve(ok(schema.spec));
        break;
      }
      case PublishedClientOperationName.getTotalCount: {
        const {
          args: [query],
          resolve,
        } = operation as PublishedClientOperation<PublishedClientOperationName.getTotalCount>;
        resolve(
          await publishedGetTotalCount(
            serverImpl.getPublishedSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            query
          )
        );
        break;
      }
      case PublishedClientOperationName.searchEntities: {
        const {
          args: [query, paging],
          resolve,
        } = operation as PublishedClientOperation<PublishedClientOperationName.searchEntities>;
        resolve(
          await publishedSearchEntities(
            serverImpl.getPublishedSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            query,
            paging
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
