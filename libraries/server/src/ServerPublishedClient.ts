import {
  PublishedClientOperationName,
  createBasePublishedClient,
  ok,
  type ContextProvider,
  type PublishedClient,
  type PublishedClientMiddleware,
  type PublishedClientOperation,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import type { AuthorizationAdapter } from './AuthorizationAdapter.js';
import type { SessionContext } from './Context.js';
import type { ServerImpl } from './Server.js';
import { publishedGetEntity } from './published-entity/publishedGetEntity.js';
import { publishedGetEntityList } from './published-entity/publishedGetEntityList.js';
import { publishedGetTotalCount } from './published-entity/publishedGetTotalCount.js';
import { publishedSampleEntities } from './published-entity/publishedSampleEntities.js';
import { publishedSearchEntities } from './published-entity/publishedSearchEntities.js';
import { assertExhaustive } from './utils/AssertUtils.js';

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
    operation: PublishedClientOperation,
  ): Promise<void> {
    switch (operation.name) {
      case PublishedClientOperationName.getEntity: {
        const {
          args: [reference],
          resolve,
        } = operation as PublishedClientOperation<typeof PublishedClientOperationName.getEntity>;
        resolve(
          await publishedGetEntity(
            serverImpl.getAdminSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            reference,
          ),
        );
        break;
      }
      case PublishedClientOperationName.getEntityList: {
        const {
          args: [references],
          resolve,
        } = operation as PublishedClientOperation<
          typeof PublishedClientOperationName.getEntityList
        >;
        resolve(
          await publishedGetEntityList(
            serverImpl.getAdminSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            references,
          ),
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
      case PublishedClientOperationName.getEntitiesTotalCount: {
        const {
          args: [query],
          resolve,
        } = operation as PublishedClientOperation<
          typeof PublishedClientOperationName.getEntitiesTotalCount
        >;
        resolve(
          await publishedGetTotalCount(
            serverImpl.getPublishedSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            query,
          ),
        );
        break;
      }
      case PublishedClientOperationName.getEntitiesSample: {
        const {
          args: [query, options],
          resolve,
        } = operation as PublishedClientOperation<
          typeof PublishedClientOperationName.getEntitiesSample
        >;
        resolve(
          await publishedSampleEntities(
            serverImpl.getAdminSchema(),
            serverImpl.getPublishedSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            query,
            options,
          ),
        );
        break;
      }
      case PublishedClientOperationName.getEntities: {
        const {
          args: [query, paging],
          resolve,
        } = operation as PublishedClientOperation<typeof PublishedClientOperationName.getEntities>;
        resolve(
          await publishedSearchEntities(
            serverImpl.getAdminSchema(),
            serverImpl.getPublishedSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            query,
            paging,
          ),
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
