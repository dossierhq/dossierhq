import {
  copyEntity,
  EntityStatus,
  ok,
  withAdvisoryLock,
  type EntityUpsert,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import { v5 as uuidv5 } from 'uuid';
import { assertExhaustive, assertOkResult, assertSame } from '../Asserts.js';
import {
  assertIsReadOnly,
  type AppDossierClient,
  type AppEntity,
  type PublishedReadOnly,
  type ReadOnly,
} from '../SchemaTypes.js';
import type { DossierClientProvider } from './TestClients.js';

const UUID_NAMESPACE = '10db07d4-3666-48e9-8080-12db0365ab81';
const ENTITIES_PER_CATEGORY = 5;
const ADVISORY_LOCK_NAME = 'integration-test-read-only-entities';

const READONLY_UPSERT: EntityUpsert<ReadOnly> = {
  id: 'REPLACE',
  info: { type: 'ReadOnly', name: `ReadOnly` },
  fields: { message: 'Hello' },
};

export class ReadOnlyEntityRepository {
  private readonly mainEntities: ReadOnly[];
  private readonly secondaryEntities: ReadOnly[];
  constructor(main: ReadOnly[], secondary: ReadOnly[]) {
    this.mainEntities = main;
    this.secondaryEntities = secondary;
  }

  getMainPrincipalAdminEntities({
    authKeys,
    status,
  }: {
    authKeys?: string[];
    status?: EntityStatus[];
  } = {}): ReadOnly[] {
    const checkAuthKeys = authKeys ?? [''];
    const checkStatus: EntityStatus[] = status ?? ['draft', 'published', 'modified', 'withdrawn'];

    const entities = [
      ...this.mainEntities.filter(
        (it) => checkAuthKeys.includes(it.info.authKey) && checkStatus.includes(it.info.status),
      ),
      ...this.secondaryEntities.filter(
        (it) =>
          it.info.authKey === '' &&
          checkAuthKeys.includes(it.info.authKey) &&
          checkStatus.includes(it.info.status),
      ),
    ];

    return entities;
  }

  getMainPrincipalPublishedEntities(authKeys?: string[]): PublishedReadOnly[] {
    const adminEntities = this.getMainPrincipalAdminEntities({ authKeys });
    const publishedOnly = adminEntities.filter(
      (it) => it.info.status === EntityStatus.published || it.info.status === EntityStatus.modified,
    );
    //TODO invalid since it always return the latest version
    const publishedEntities: PublishedReadOnly[] = publishedOnly.map((it) => ({
      id: it.id,
      info: {
        type: it.info.type,
        name: it.info.name,
        authKey: it.info.authKey,
        valid: it.info.validPublished ?? false,
        createdAt: it.info.createdAt,
      },
      fields: it.fields as PublishedReadOnly['fields'],
    }));
    return publishedEntities;
  }
}

const createEntitiesPromises: Record<
  string,
  | PromiseResult<
      ReadOnlyEntityRepository,
      typeof ErrorType.BadRequest | typeof ErrorType.NotFound | typeof ErrorType.Generic
    >
  | undefined
> = {};

export async function createReadOnlyEntityRepository(
  clientProvider: DossierClientProvider,
  databaseName?: string,
): PromiseResult<
  ReadOnlyEntityRepository,
  typeof ErrorType.BadRequest | typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  // Wrap in a promise to use the same result for all instances running in the same process
  // If multiple databases (e.g. sqlite databases) are used in the same process, specify different
  // names in the `databaseName` parameter
  const resolvedName = databaseName ?? 'shared';
  let promise = createEntitiesPromises[resolvedName];
  if (!promise) {
    promise = doCreateReadOnlyEntityRepository(clientProvider);
    createEntitiesPromises[resolvedName] = promise;
  }
  return promise;
}

async function doCreateReadOnlyEntityRepository(
  clientProvider: DossierClientProvider,
): PromiseResult<
  ReadOnlyEntityRepository,
  typeof ErrorType.BadRequest | typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const clientMain = clientProvider.dossierClient('main');
  const clientSecondary = clientProvider.dossierClient('secondary');

  return await withAdvisoryLock(
    clientMain,
    ADVISORY_LOCK_NAME,
    { acquireInterval: 500, leaseDuration: 2_000, renewInterval: 1_000 },
    async (advisoryLock) => {
      // Decide configurations for the entities
      const entityConfigs: {
        principal: 'main' | 'secondary';
        authKey: '' | 'subject';
        status: EntityStatus;
        index: number;
      }[] = [];
      for (const principal of ['secondary', 'main'] as const) {
        for (const authKey of ['', 'subject'] as const) {
          for (const status of Object.values(EntityStatus)) {
            for (let index = 0; index < ENTITIES_PER_CATEGORY; index++) {
              entityConfigs.push({ principal, authKey, status, index });
            }
          }
        }
      }

      const mainEntities: ReadOnly[] = [];
      const secondaryEntities: ReadOnly[] = [];

      for (const { principal, authKey, status, index } of entityConfigs) {
        if (!advisoryLock.active) {
          return advisoryLock.renewError;
        }
        const client = principal === 'main' ? clientMain : clientSecondary;
        const id = uuidv5(`${principal}-${authKey}-${status}-${index}`, UUID_NAMESPACE);
        const result = await createEntity(client, id, authKey, status);
        assertOkResult(result);
        (principal === 'main' ? mainEntities : secondaryEntities).push(result.value);
      }

      return ok(new ReadOnlyEntityRepository(mainEntities, secondaryEntities));
    },
  );
}

async function createEntity(
  client: AppDossierClient,
  id: string,
  authKey: AppEntity['info']['authKey'],
  status: EntityStatus,
): PromiseResult<
  ReadOnly,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.NotFound
  | typeof ErrorType.Generic
> {
  // Check if it already exists (to save some time)
  const getResult = await client.getEntity({ id });
  if (
    getResult.isOk() &&
    getResult.value.info.authKey === authKey &&
    getResult.value.info.status === status
  ) {
    assertIsReadOnly(getResult.value);
    return ok(getResult.value);
  }

  // Create/upsert entity
  const upsertResult = await client.upsertEntity(
    copyEntity(READONLY_UPSERT, { id, info: { authKey } }),
    {
      publish:
        status === EntityStatus.withdrawn ||
        status === EntityStatus.modified ||
        status === EntityStatus.published,
    },
  );
  if (upsertResult.isError()) return upsertResult;
  let { entity } = upsertResult.value;

  switch (status) {
    case EntityStatus.draft:
      break;
    case EntityStatus.published:
      break;
    case EntityStatus.modified: {
      const updateResult = await client.updateEntity<ReadOnly>({
        id,
        fields: { message: 'Updated message' },
      });
      if (updateResult.isError()) return updateResult;
      entity = updateResult.value.entity;
      break;
    }
    case EntityStatus.withdrawn: {
      const unpublishResult = await client.unpublishEntities([{ id }]);
      if (unpublishResult.isError()) return unpublishResult;
      entity.info.status = unpublishResult.value[0].status;
      entity.info.updatedAt = unpublishResult.value[0].updatedAt;
      break;
    }
    case EntityStatus.archived: {
      const archiveResult = await client.archiveEntity({ id });
      if (archiveResult.isError()) return archiveResult;
      entity.info.status = archiveResult.value.status;
      entity.info.updatedAt = archiveResult.value.updatedAt;
      break;
    }
    default:
      assertExhaustive(status);
  }

  assertSame(entity.info.status, status);

  return ok(entity);
}
