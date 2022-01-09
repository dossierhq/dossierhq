import type {
  AdminClient,
  AdminEntity,
  AdminEntityUpsert,
  PromiseResult,
  PublishedEntity,
  Result,
} from '@jonasb/datadata-core';
import {
  AdminEntityStatus,
  assertExhaustive,
  copyEntity,
  ErrorType,
  notOk,
  ok,
} from '@jonasb/datadata-core';
import type { Server } from '@jonasb/datadata-server';
import { v5 as uuidv5 } from 'uuid';
import { assertOkResult, assertSame } from '../Asserts';
import { adminClientForMainPrincipal, adminClientForSecondaryPrincipal } from './TestClients';

const UUID_NAMESPACE = '10db07d4-3666-48e9-8080-12db0365ab81';
const ENTITIES_PER_CATEGORY = 5;
const MAX_RETRY_COUNT = 3;

const READONLY_UPSERT: AdminEntityUpsert = {
  id: 'REPLACE',
  info: { type: 'ReadOnly', name: `ReadOnly`, authKey: 'none' },
  fields: { message: 'Hello' },
};

export class ReadOnlyEntityRepository {
  private readonly mainEntities: AdminEntity[];
  private readonly secondaryEntities: AdminEntity[];
  constructor(main: AdminEntity[], secondary: AdminEntity[]) {
    this.mainEntities = main;
    this.secondaryEntities = secondary;
  }

  getMainPrincipalAdminEntities(authKeys?: string[]): AdminEntity[] {
    const checkAuthKeys = authKeys ?? ['none'];

    const entities = [
      ...this.mainEntities.filter((it) => checkAuthKeys.includes(it.info.authKey)),
      ...this.secondaryEntities.filter(
        (it) => it.info.authKey === 'none' && checkAuthKeys.includes(it.info.authKey)
      ),
    ];

    return entities;
  }

  getMainPrincipalPublishedEntities(authKeys?: string[]): PublishedEntity[] {
    const adminEntities = this.getMainPrincipalAdminEntities(authKeys);
    const publishedOnly = adminEntities.filter((it) =>
      [AdminEntityStatus.published, AdminEntityStatus.modified].includes(it.info.status)
    );
    //TODO invalid since it always return the latest version
    const publishedEntities: PublishedEntity[] = publishedOnly.map((it) => ({
      id: it.id,
      info: {
        type: it.info.type,
        name: it.info.name,
        authKey: it.info.authKey,
        createdAt: it.info.createdAt,
      },
      fields: it.fields,
    }));
    return publishedEntities;
  }
}

let createEntitiesPromise: Promise<ReadOnlyEntityRepository> | null = null;

export async function createReadOnlyEntityRepository(
  server: Server
): Promise<ReadOnlyEntityRepository> {
  if (!createEntitiesPromise) {
    createEntitiesPromise = (async (): Promise<ReadOnlyEntityRepository> => {
      const mainEntities: AdminEntity[] = [];
      const secondaryEntities: AdminEntity[] = [];

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

      // Randomize order (in order to avoid trying to create same entity at the same time when running from different test runners)
      entityConfigs.sort(() => 0.5 - Math.random());

      const adminClientMain = adminClientForMainPrincipal(server);
      const adminClientSecondary = adminClientForSecondaryPrincipal(server);

      for (const { principal, authKey, status, index } of entityConfigs) {
        const adminClient = principal === 'main' ? adminClientMain : adminClientSecondary;
        const id = uuidv5(`${principal}-${authKey}-${status}-${index}`, UUID_NAMESPACE);
        const result = await createEntityRetry(adminClient, id, authKey, status);
        assertOkResult(result);
        (principal === 'main' ? mainEntities : secondaryEntities).push(result.value);
      }

      return new ReadOnlyEntityRepository(mainEntities, secondaryEntities);
    })();
  }
  return createEntitiesPromise;
}

async function createEntityRetry(
  adminClient: AdminClient,
  id: string,
  authKey: string,
  status: AdminEntityStatus
): PromiseResult<
  AdminEntity,
  ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.NotFound | ErrorType.Generic
> {
  let result: Result<
    AdminEntity,
    ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.NotFound | ErrorType.Generic
  >;
  const newLocal = true;
  for (let retry = 0; newLocal; retry++) {
    result = await createEntity(adminClient, id, authKey, status);
    if (result.isOk()) {
      return result;
    }
    if (!result.isErrorType(ErrorType.Generic)) {
      return result;
    }
    // Could fail with deadlock if multiple instances try to create the same entity at the same time
    if (retry === MAX_RETRY_COUNT) {
      return result;
    }
  }
  return notOk.Generic('Should not happen');
}

async function createEntity(
  adminClient: AdminClient,
  id: string,
  authKey: string,
  status: AdminEntityStatus
): PromiseResult<
  AdminEntity,
  ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.NotFound | ErrorType.Generic
> {
  // Check if it already exists (to save some time)
  const getResult = await adminClient.getEntity({ id });
  if (
    getResult.isOk() &&
    getResult.value.info.authKey === authKey &&
    getResult.value.info.status === status
  ) {
    return getResult;
  }

  // Create/upsert entity
  const upsertResult = await adminClient.upsertEntity(
    copyEntity(READONLY_UPSERT, { id, info: { authKey } }),
    {
      publish: [
        AdminEntityStatus.withdrawn,
        AdminEntityStatus.modified,
        AdminEntityStatus.published,
      ].includes(status),
    }
  );
  if (upsertResult.isError()) return upsertResult;
  let { entity } = upsertResult.value;

  switch (status) {
    case AdminEntityStatus.draft:
      break;
    case AdminEntityStatus.published:
      break;
    case AdminEntityStatus.modified: {
      const updateResult = await adminClient.updateEntity({
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
