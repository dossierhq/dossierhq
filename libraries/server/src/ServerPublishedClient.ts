import type {
  ContextProvider,
  PublishedClient,
  PublishedClientMiddleware,
  PublishedClientOperation,
} from '@dossierhq/core';
import {
  assertExhaustive,
  createBasePublishedClient,
  ok,
  PublishedClientOperationName,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type { AuthorizationAdapter } from './AuthorizationAdapter.js';
import type { SessionContext } from './Context.js';
import { publishedGetEntities } from './published-entity/publishedGetEntities.js';
import { publishedGetEntity } from './published-entity/publishedGetEntity.js';
import { publishedGetTotalCount } from './published-entity/publishedGetTotalCount.js';
import { publishedSampleEntities } from './published-entity/publishedSampleEntities.js';
import { publishedSearchEntities } from './published-entity/publishedSearchEntities.js';
import type { ServerImpl } from './Server.js';

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
        } = operation as PublishedClientOperation<typeof PublishedClientOperationName.getEntities>;
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
        } = operation as PublishedClientOperation<typeof PublishedClientOperationName.getEntity>;
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
        const { resolve } = operation as PublishedClientOperation<
          typeof PublishedClientOperationName.getSchemaSpecification
        >;
        const schema = serverImpl.getPublishedSchema();
        resolve(ok(schema.spec));
        break;
      }
      case PublishedClientOperationName.getTotalCount: {
        const {
          args: [query],
          resolve,
        } = operation as PublishedClientOperation<
          typeof PublishedClientOperationName.getTotalCount
        >;
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
      case PublishedClientOperationName.sampleEntities: {
        const {
          args: [query, options],
          resolve,
        } = operation as PublishedClientOperation<
          typeof PublishedClientOperationName.sampleEntities
        >;
        resolve(
          await publishedSampleEntities(
            serverImpl.getPublishedSchema(),
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
          args: [query, paging],
          resolve,
        } = operation as PublishedClientOperation<
          typeof PublishedClientOperationName.searchEntities
        >;
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
