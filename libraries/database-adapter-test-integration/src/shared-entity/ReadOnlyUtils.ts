import type { AdminEntity, ErrorType, PromiseResult, PublishedEntity } from '@jonasb/datadata-core';
import { AdminEntityStatus, notOk, ok } from '@jonasb/datadata-core';
import type { Server } from '@jonasb/datadata-server';
import { adminClientForMainPrincipal } from './TestClients';

let entities: AdminEntity[] | null = null;

const ids = [
  '573056ca-d48a-4333-ad0d-b11ac59d2b0a',
  '200eec97-6572-475a-ae0c-a4a39fa2977e',
  '1c1dcffa-c18b-4dfc-9fff-70ef719bebda',
  'ceaee21c-9ab7-4dbe-9c9d-35f3cbf4eb73',
  '3e648346-2940-4780-beba-c2ca415b49b2',
  '12b7bb05-b32c-4234-8f3e-88791920e003',
  'f6f64ed1-988c-4db8-b58c-e612fefcf7a0',
  'ace348b6-ca43-48bf-ae42-4270d98f978c',
  'fee697fe-c315-4c3e-a61b-1da5f6ba9e91',
  'f53e5851-91ed-4966-ab43-da5fe8893396',
];

async function createEntities(server: Server): PromiseResult<AdminEntity[], ErrorType.Generic> {
  if (entities) return ok(entities);

  const adminClient = adminClientForMainPrincipal(server);
  const newEntities: AdminEntity[] = [];
  for (const [index, id] of ids.entries()) {
    const upsertResult = await adminClient.upsertEntity(
      {
        id,
        info: { type: 'ReadOnly', name: `ReadOnly`, authKey: 'none' },
        fields: { message: 'Hello' },
      },
      { publish: index < ids.length * 0.8 }
    );
    if (upsertResult.isError()) return notOk.GenericUnexpectedError(upsertResult);
    newEntities.push(upsertResult.value.entity);
  }

  entities = newEntities;
  return ok(entities);
}

export async function getReadOnlyAdminEntities(
  server: Server
): PromiseResult<AdminEntity[], ErrorType.Generic> {
  return createEntities(server);
}

export async function getReadOnlyPublishedEntities(
  server: Server
): PromiseResult<PublishedEntity[], ErrorType.Generic> {
  const adminEntities = await getReadOnlyAdminEntities(server);
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
