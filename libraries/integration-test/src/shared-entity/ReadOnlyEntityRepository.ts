import type { AdminEntityUpsert, ErrorType, PromiseResult } from '@dossierhq/core';
import {
  AdminEntityStatus,
  assertExhaustive,
  copyEntity,
  ok,
  withAdvisoryLock,
} from '@dossierhq/core';
import type { Server } from '@dossierhq/server';
import { v5 as uuidv5 } from 'uuid';
import { assertOkResult, assertSame } from '../Asserts.js';
import {
  assertIsAdminReadOnly,
  type AdminReadOnly,
  type AppAdminClient,
  type PublishedReadOnly,
} from '../SchemaTypes.js';
import { adminClientForMainPrincipal, adminClientForSecondaryPrincipal } from './TestClients.js';

const UUID_NAMESPACE = '10db07d4-3666-48e9-8080-12db0365ab81';
const ENTITIES_PER_CATEGORY = 5;
const ADVISORY_LOCK_NAME = 'integration-test-read-only-entities';

const READONLY_UPSERT: AdminEntityUpsert<AdminReadOnly> = {
  id: 'REPLACE',
  info: { type: 'ReadOnly', name: `ReadOnly`, authKey: 'none' },
  fields: { message: 'Hello' },
};

export class ReadOnlyEntityRepository {
  private readonly mainEntities: AdminReadOnly[];
  private readonly secondaryEntities: AdminReadOnly[];
  constructor(main: AdminReadOnly[], secondary: AdminReadOnly[]) {
    this.mainEntities = main;
    this.secondaryEntities = secondary;
  }

  getMainPrincipalAdminEntities(authKeys?: string[]): AdminReadOnly[] {
    const checkAuthKeys = authKeys ?? ['none'];

    const entities = [
      ...this.mainEntities.filter((it) => checkAuthKeys.includes(it.info.authKey)),
      ...this.secondaryEntities.filter(
        (it) => it.info.authKey === 'none' && checkAuthKeys.includes(it.info.authKey),
      ),
    ];

    return entities;
  }

  getMainPrincipalPublishedEntities(authKeys?: string[]): PublishedReadOnly[] {
    const adminEntities = this.getMainPrincipalAdminEntities(authKeys);
    const publishedOnly = adminEntities.filter(
      (it) =>
        it.info.status === AdminEntityStatus.published ||
        it.info.status === AdminEntityStatus.modified,
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
  server: Server,
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
    promise = doCreateReadOnlyEntityRepository(server);
    createEntitiesPromises[resolvedName] = promise;
  }
  return promise;
}

async function doCreateReadOnlyEntityRepository(
  server: Server,
): PromiseResult<
  ReadOnlyEntityRepository,
  typeof ErrorType.BadRequest | typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const adminClientMain = adminClientForMainPrincipal(server);
  const adminClientSecondary = adminClientForSecondaryPrincipal(server);

  return await withAdvisoryLock(
    adminClientMain,
    ADVISORY_LOCK_NAME,
    { acquireInterval: 500, leaseDuration: 2_000, renewInterval: 2_000 - 200 },
    async (advisoryLock) => {
      // Decide configurations for the entities
      const entityConfigs: {
        principal: 'main' | 'secondary';
        authKey: 'none' | 'subject';
        status: AdminEntityStatus;
        index: number;
      }[] = [];
      for (const principal of ['secondary', 'main'] as const) {
        for (const authKey of ['none', 'subject'] as const) {
          for (const status of Object.values(AdminEntityStatus)) {
            for (let index = 0; index < ENTITIES_PER_CATEGORY; index++) {
              entityConfigs.push({ principal, authKey, status, index });
            }
          }
        }
      }

      const mainEntities: AdminReadOnly[] = [];
      const secondaryEntities: AdminReadOnly[] = [];

      for (const { principal, authKey, status, index } of entityConfigs) {
        if (!advisoryLock.active) {
          return advisoryLock.renewError;
        }
        const adminClient = principal === 'main' ? adminClientMain : adminClientSecondary;
        const id = uuidv5(`${principal}-${authKey}-${status}-${index}`, UUID_NAMESPACE);
        const result = await createEntity(adminClient, id, authKey, status);
        assertOkResult(result);
        (principal === 'main' ? mainEntities : secondaryEntities).push(result.value);
      }

      return ok(new ReadOnlyEntityRepository(mainEntities, secondaryEntities));
    },
  );
}

async function createEntity(
  adminClient: AppAdminClient,
  id: string,
  authKey: string,
  status: AdminEntityStatus,
): PromiseResult<
  AdminReadOnly,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.NotFound
  | typeof ErrorType.Generic
> {
  // Check if it already exists (to save some time)
  const getResult = await adminClient.getEntity({ id });
  if (
    getResult.isOk() &&
    getResult.value.info.authKey === authKey &&
    getResult.value.info.status === status
  ) {
    assertIsAdminReadOnly(getResult.value);
    return ok(getResult.value);
  }

  // Create/upsert entity
  const upsertResult = await adminClient.upsertEntity(
    copyEntity(READONLY_UPSERT, { id, info: { authKey } }),
    {
      publish:
        status === AdminEntityStatus.withdrawn ||
        status === AdminEntityStatus.modified ||
        status === AdminEntityStatus.published,
    },
  );
  if (upsertResult.isError()) return upsertResult;
  let { entity } = upsertResult.value;

  switch (status) {
    case AdminEntityStatus.draft:
      break;
    case AdminEntityStatus.published:
      break;
    case AdminEntityStatus.modified: {
      const updateResult = await adminClient.updateEntity<AdminReadOnly>({
        id,
        fields: { message: 'Updated message' },
      });
      if (updateResult.isError()) return updateResult;
      entity = updateResult.value.entity;
      break;
    }
    case AdminEntityStatus.withdrawn: {
      const unpublishResult = await adminClient.unpublishEntities([{ id }]);
      if (unpublishResult.isError()) return unpublishResult;
      entity.info.status = unpublishResult.value[0].status;
      entity.info.updatedAt = unpublishResult.value[0].updatedAt;
      break;
    }
    case AdminEntityStatus.archived: {
      const archiveResult = await adminClient.archiveEntity({ id });
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
