import type { AdminEntity, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
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

export async function getReadOnlyEntities(
  server: Server
): PromiseResult<AdminEntity[], ErrorType.Generic> {
  if (entities) return ok(entities);

  const adminClient = adminClientForMainPrincipal(server);
  const newEntities: AdminEntity[] = [];
  for (const id of ids) {
    const upsertResult = await adminClient.upsertEntity({
      id,
      info: { type: 'ReadOnly', name: `ReadOnly`, authKey: 'none' },
      fields: { message: 'Hello' },
    });
    if (upsertResult.isError()) return notOk.GenericUnexpectedError(upsertResult);
    newEntities.push(upsertResult.value.entity);
  }
  entities = newEntities;
  return ok(entities);
}
