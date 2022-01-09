import type {
  AdminClient,
  AdminEntity,
  AdminEntityUpsert,
  ErrorType,
  PromiseResult,
  PublishedEntity,
} from '@jonasb/datadata-core';
import { AdminEntityStatus, assertExhaustive, copyEntity, notOk, ok } from '@jonasb/datadata-core';
import type { Server } from '@jonasb/datadata-server';
import { v5 as uuidv5 } from 'uuid';
import { assertSame } from '../Asserts';
import { adminClientForMainPrincipal, adminClientForSecondaryPrincipal } from './TestClients';

const UUID_NAMESPACE = '10db07d4-3666-48e9-8080-12db0365ab81';
const ENTITIES_PER_CATEGORY = 5;

const READONLY_UPSERT: AdminEntityUpsert = {
  id: 'REPLACE',
  info: { type: 'ReadOnly', name: `ReadOnly`, authKey: 'none' },
  fields: { message: 'Hello' },
};

let createEntitiesPromise: PromiseResult<
  { main: AdminEntity[]; secondary: AdminEntity[] },
  ErrorType.Generic
> | null = null;

async function createEntities(
  server: Server
): PromiseResult<{ main: AdminEntity[]; secondary: AdminEntity[] }, ErrorType.Generic> {
  if (!createEntitiesPromise) {
    createEntitiesPromise = (async (): PromiseResult<
      { main: AdminEntity[]; secondary: AdminEntity[] },
      ErrorType.Generic
    > => {
      const mainEntities: AdminEntity[] = [];
      const secondaryEntities: AdminEntity[] = [];

      for (const principal of ['main', 'secondary'] as const) {
        const adminClient =
          principal === 'main'
            ? adminClientForMainPrincipal(server)
            : adminClientForSecondaryPrincipal(server);
        const principalEntities: AdminEntity[] =
          principal === 'main' ? mainEntities : secondaryEntities;
        for (const authKey of ['none', 'subject']) {
          for (const status of Object.values(AdminEntityStatus)) {
            for (let index = 0; index < ENTITIES_PER_CATEGORY; index++) {
              const id = uuidv5(`${principal}-${authKey}-${status}-${index}`, UUID_NAMESPACE);
              const result = await createEntity(adminClient, id, authKey, status);
              if (result.isError()) return notOk.GenericUnexpectedError(result);
              principalEntities.push(result.value);
            }
          }
        }
      }
      return ok({ main: mainEntities, secondary: secondaryEntities });
    })();
  }
  return createEntitiesPromise;
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

export async function getMainPrincipalReadOnlyAdminEntities(
  server: Server,
  authKeys: string[] = ['none']
): PromiseResult<AdminEntity[], ErrorType.Generic> {
  const entitiesResult = await createEntities(server);
  if (entitiesResult.isError()) return entitiesResult;
  const { main, secondary } = entitiesResult.value;

  const entities = [
    ...main.filter((it) => authKeys.includes(it.info.authKey)),
    ...secondary.filter((it) => it.info.authKey === 'none' && authKeys.includes(it.info.authKey)),
  ];

  return ok(entities);
}

export async function getMainPrincipalReadOnlyPublishedEntities(
  server: Server
): PromiseResult<PublishedEntity[], ErrorType.Generic> {
  const adminEntities = await getMainPrincipalReadOnlyAdminEntities(server);
  if (adminEntities.isError()) return adminEntities;
  const publishedOnly = adminEntities.value.filter((it) =>
    [AdminEntityStatus.published, AdminEntityStatus.modified].includes(it.info.status)
  );
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
  return ok(publishedEntities);
}
