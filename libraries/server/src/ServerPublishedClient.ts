import {
  createBasePublishedDossierClient,
  ok,
  PublishedDossierClientOperationName,
  type ContextProvider,
  type PublishedDossierClient,
  type PublishedDossierClientMiddleware,
  type PublishedDossierClientOperation,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import type { AuthorizationAdapter } from './AuthorizationAdapter.js';
import type { SessionContext } from './Context.js';
import { publishedGetEntity } from './published-entity/publishedGetEntity.js';
import { publishedGetEntityList } from './published-entity/publishedGetEntityList.js';
import { publishedGetTotalCount } from './published-entity/publishedGetTotalCount.js';
import { publishedSampleEntities } from './published-entity/publishedSampleEntities.js';
import { publishedSearchEntities } from './published-entity/publishedSearchEntities.js';
import type { ServerImpl } from './Server.js';
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
  middleware: PublishedDossierClientMiddleware<SessionContext>[];
}): PublishedDossierClient {
  async function terminatingMiddleware(
    context: SessionContext,
    operation: PublishedDossierClientOperation,
  ): Promise<void> {
    switch (operation.name) {
      case PublishedDossierClientOperationName.getEntity: {
        const {
          args: [reference],
          resolve,
        } = operation as PublishedDossierClientOperation<
          typeof PublishedDossierClientOperationName.getEntity
        >;
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
      case PublishedDossierClientOperationName.getEntityList: {
        const {
          args: [references],
          resolve,
        } = operation as PublishedDossierClientOperation<
          typeof PublishedDossierClientOperationName.getEntityList
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
      case PublishedDossierClientOperationName.getSchemaSpecification: {
        const { resolve } = operation as PublishedDossierClientOperation<
          typeof PublishedDossierClientOperationName.getSchemaSpecification
        >;
        const schema = serverImpl.getPublishedSchema();
        resolve(ok(schema.spec));
        break;
      }
      case PublishedDossierClientOperationName.getEntitiesTotalCount: {
        const {
          args: [query],
          resolve,
        } = operation as PublishedDossierClientOperation<
          typeof PublishedDossierClientOperationName.getEntitiesTotalCount
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
      case PublishedDossierClientOperationName.getEntitiesSample: {
        const {
          args: [query, options],
          resolve,
        } = operation as PublishedDossierClientOperation<
          typeof PublishedDossierClientOperationName.getEntitiesSample
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
      case PublishedDossierClientOperationName.getEntities: {
        const {
          args: [query, paging],
          resolve,
        } = operation as PublishedDossierClientOperation<
          typeof PublishedDossierClientOperationName.getEntities
        >;
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

  return createBasePublishedDossierClient<SessionContext>({
    context,
    pipeline: [...middleware, terminatingMiddleware],
  });
}
