import {
  createBaseDossierClient,
  DossierClientOperationName,
  notOk,
  ok,
  type ContextProvider,
  type DossierClient,
  type DossierClientMiddleware,
  type DossierClientOperation,
  type EntityCreate,
  type EntityUpdate,
  type EntityUpsert,
  type SchemaSpecificationWithMigrations,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import { adminArchiveEntity } from './admin-entity/adminArchiveEntity.js';
import { adminCreateEntity } from './admin-entity/adminCreateEntity.js';
import { adminGetEntity } from './admin-entity/adminGetEntity.js';
import { adminGetEntityList } from './admin-entity/adminGetEntityList.js';
import { adminGetTotalCount } from './admin-entity/adminGetTotalCount.js';
import { adminPublishEntities } from './admin-entity/adminPublishEntities.js';
import { adminSampleEntities } from './admin-entity/adminSampleEntities.js';
import { adminSearchEntities } from './admin-entity/adminSearchEntities.js';
import { adminUnarchiveEntity } from './admin-entity/adminUnarchiveEntity.js';
import { adminUnpublishEntities } from './admin-entity/adminUnpublishEntities.js';
import { adminUpdateEntity } from './admin-entity/adminUpdateEntity.js';
import { adminUpsertEntity } from './admin-entity/adminUpsertEntity.js';
import { acquireAdvisoryLock } from './advisory-lock/acquireAdvisoryLock.js';
import { releaseAdvisoryLock } from './advisory-lock/releaseAdvisoryLock.js';
import { renewAdvisoryLock } from './advisory-lock/renewAdvisoryLock.js';
import type { AuthorizationAdapter } from './AuthorizationAdapter.js';
import type { SessionContext } from './Context.js';
import { eventGetChangelogEvents } from './event/eventGetChangelogEvents.js';
import { eventGetChangelogEventsTotalCount } from './event/eventGetChangelogEventsTotalCount.js';
import { managementDirtyProcessNextEntity } from './management/managementDirtyProcessNextEntity.js';
import { schemaUpdateSpecification } from './schema/schemaUpdateSpecification.js';
import type { ServerImpl } from './Server.js';
import { assertExhaustive } from './utils/AssertUtils.js';

export function createServerDossierClient({
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
  middleware: DossierClientMiddleware<SessionContext>[];
}): DossierClient {
  async function terminatingMiddleware(
    context: SessionContext,
    operation: DossierClientOperation,
  ): Promise<void> {
    switch (operation.name) {
      case DossierClientOperationName.acquireAdvisoryLock: {
        const {
          args: [name, options],
          resolve,
        } = operation as DossierClientOperation<
          typeof DossierClientOperationName.acquireAdvisoryLock
        >;
        resolve(await acquireAdvisoryLock(databaseAdapter, context, name, options));
        break;
      }
      case DossierClientOperationName.archiveEntity: {
        const {
          args: [reference],
          resolve,
        } = operation as DossierClientOperation<typeof DossierClientOperationName.archiveEntity>;
        resolve(
          await adminArchiveEntity(databaseAdapter, authorizationAdapter, context, reference),
        );
        break;
      }
      case DossierClientOperationName.createEntity: {
        const {
          args: [entity, options],
          resolve,
        } = operation as DossierClientOperation<typeof DossierClientOperationName.createEntity>;
        resolve(
          await adminCreateEntity(
            serverImpl.getAdminSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            entity as EntityCreate,
            options,
          ),
        );
        break;
      }
      case DossierClientOperationName.getChangelogEvents: {
        const {
          args: [query, paging],
          resolve,
        } = operation as DossierClientOperation<
          typeof DossierClientOperationName.getChangelogEvents
        >;
        resolve(
          await eventGetChangelogEvents(
            authorizationAdapter,
            databaseAdapter,
            context,
            query,
            paging,
          ),
        );
        break;
      }
      case DossierClientOperationName.getChangelogEventsTotalCount: {
        const {
          args: [query],
          resolve,
        } = operation as DossierClientOperation<
          typeof DossierClientOperationName.getChangelogEventsTotalCount
        >;
        resolve(
          await eventGetChangelogEventsTotalCount(
            authorizationAdapter,
            databaseAdapter,
            context,
            query,
          ),
        );
        break;
      }
      case DossierClientOperationName.getEntities: {
        const {
          args: [query, paging],
          resolve,
        } = operation as DossierClientOperation<typeof DossierClientOperationName.getEntities>;
        resolve(
          await adminSearchEntities(
            serverImpl.getAdminSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            query,
            paging,
          ),
        );
        break;
      }
      case DossierClientOperationName.getEntitiesSample: {
        const {
          args: [query, options],
          resolve,
        } = operation as DossierClientOperation<
          typeof DossierClientOperationName.getEntitiesSample
        >;
        resolve(
          await adminSampleEntities(
            serverImpl.getAdminSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            query,
            options,
          ),
        );
        break;
      }
      case DossierClientOperationName.getEntitiesTotalCount: {
        const {
          args: [query],
          resolve,
        } = operation as DossierClientOperation<
          typeof DossierClientOperationName.getEntitiesTotalCount
        >;
        resolve(
          await adminGetTotalCount(
            serverImpl.getAdminSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            query,
          ),
        );
        break;
      }
      case DossierClientOperationName.getEntity: {
        const {
          args: [reference],
          resolve,
        } = operation as DossierClientOperation<typeof DossierClientOperationName.getEntity>;
        resolve(
          await adminGetEntity(
            serverImpl.getAdminSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            reference,
          ),
        );
        break;
      }
      case DossierClientOperationName.getEntityList: {
        const {
          args: [references],
          resolve,
        } = operation as DossierClientOperation<typeof DossierClientOperationName.getEntityList>;
        resolve(
          await adminGetEntityList(
            serverImpl.getAdminSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            references,
          ),
        );
        break;
      }
      case DossierClientOperationName.getSchemaSpecification: {
        const {
          args: [options],
          resolve,
        } = operation as DossierClientOperation<
          typeof DossierClientOperationName.getSchemaSpecification
        >;
        const schema = serverImpl.getAdminSchema();
        const includeMigrations = options?.includeMigrations ?? false;
        if (!includeMigrations) {
          const { migrations: _, ...spec } = schema.spec;
          resolve(ok(spec));
        } else {
          resolve(ok(schema.spec));
        }
        break;
      }
      case DossierClientOperationName.processDirtyEntity: {
        const {
          args: [reference],
          resolve,
        } = operation as DossierClientOperation<
          typeof DossierClientOperationName.processDirtyEntity
        >;
        if (context.session.type === 'readonly') {
          resolve(notOk.BadRequest('Readonly session used to process dirty entity'));
        } else if (!reference || typeof reference.id !== 'string') {
          resolve(notOk.BadRequest('Invalid reference'));
        } else {
          resolve(
            await managementDirtyProcessNextEntity(
              serverImpl.getAdminSchema(),
              databaseAdapter,
              context,
              reference,
            ),
          );
        }
        break;
      }
      case DossierClientOperationName.publishEntities: {
        const {
          args: [references],
          resolve,
        } = operation as DossierClientOperation<typeof DossierClientOperationName.publishEntities>;
        resolve(
          await adminPublishEntities(
            serverImpl.getAdminSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            references,
          ),
        );
        break;
      }
      case DossierClientOperationName.releaseAdvisoryLock: {
        const {
          args: [name, handle],
          resolve,
        } = operation as DossierClientOperation<
          typeof DossierClientOperationName.releaseAdvisoryLock
        >;
        resolve(await releaseAdvisoryLock(databaseAdapter, context, name, handle));
        break;
      }
      case DossierClientOperationName.renewAdvisoryLock: {
        const {
          args: [name, handle],
          resolve,
        } = operation as DossierClientOperation<
          typeof DossierClientOperationName.renewAdvisoryLock
        >;
        resolve(await renewAdvisoryLock(databaseAdapter, context, name, handle));
        break;
      }
      case DossierClientOperationName.unarchiveEntity: {
        const {
          args: [reference],
          resolve,
        } = operation as DossierClientOperation<typeof DossierClientOperationName.unarchiveEntity>;
        resolve(
          await adminUnarchiveEntity(databaseAdapter, authorizationAdapter, context, reference),
        );
        break;
      }
      case DossierClientOperationName.unpublishEntities: {
        const {
          args: [references],
          resolve,
        } = operation as DossierClientOperation<
          typeof DossierClientOperationName.unpublishEntities
        >;
        resolve(
          await adminUnpublishEntities(databaseAdapter, authorizationAdapter, context, references),
        );
        break;
      }
      case DossierClientOperationName.updateEntity: {
        const {
          args: [entity, options],
          resolve,
        } = operation as DossierClientOperation<typeof DossierClientOperationName.updateEntity>;
        resolve(
          await adminUpdateEntity(
            serverImpl.getAdminSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            entity as EntityUpdate,
            options,
          ),
        );
        break;
      }
      case DossierClientOperationName.updateSchemaSpecification: {
        const {
          args: [schemaSpec, options],
          resolve,
        } = operation as DossierClientOperation<
          typeof DossierClientOperationName.updateSchemaSpecification
        >;
        const includeMigrations = options?.includeMigrations ?? false;
        const result = await schemaUpdateSpecification(databaseAdapter, context, schemaSpec);
        if (result.isOk()) {
          serverImpl.setAdminSchema(result.value.schemaSpecification);

          if (!includeMigrations) {
            const { migrations: _, ...spec } = result.value.schemaSpecification;
            result.value.schemaSpecification = spec as SchemaSpecificationWithMigrations;
          }
        }
        resolve(result);
        break;
      }
      case DossierClientOperationName.upsertEntity: {
        const {
          args: [entity, options],
          resolve,
        } = operation as DossierClientOperation<typeof DossierClientOperationName.upsertEntity>;
        resolve(
          await adminUpsertEntity(
            serverImpl.getAdminSchema(),
            authorizationAdapter,
            databaseAdapter,
            context,
            entity as EntityUpsert,
            options,
          ),
        );
        break;
      }
      default:
        assertExhaustive(operation.name);
    }
  }

  return createBaseDossierClient<SessionContext>({
    context,
    pipeline: [...middleware, terminatingMiddleware],
  });
}
