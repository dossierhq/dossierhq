import { assertEquals, assertOkResult } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import {
  createEntityWithInvalidComponent,
  createInvalidEntity,
} from '../shared-entity/InvalidEntityUtils.js';
import type { SchemaTestContext } from './SchemaTestSuite.js';

export const ServerProcessNextDirtyEntitySubSuite: UnboundTestFunction<SchemaTestContext>[] = [
  serverProcessNextDirtyEntity_all,
  serverProcessNextDirtyEntity_changingValidationsWithInvalidEntity,
  serverProcessNextDirtyEntity_changingValidationsWithInvalidPublishedEntity,
  serverProcessNextDirtyEntity_changingValidationsWithInvalidComponent,
];

async function serverProcessNextDirtyEntity_all({ server }: SchemaTestContext) {
  let done = false;
  while (!done) {
    const result = await server.processNextDirtyEntity();
    assertOkResult(result);
    if (!result.value) {
      done = true;
    }
  }
}
serverProcessNextDirtyEntity_all.timeout = 'long';

async function serverProcessNextDirtyEntity_changingValidationsWithInvalidEntity({
  clientProvider,
  server,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();

  const { entity, validations } = (
    await createInvalidEntity(server, adminClient, { matchPattern: 'no match' })
  ).valueOrThrow();

  assertEquals(validations, [
    {
      id: entity.id,
      valid: false,
      validPublished: null,
      previousValid: true,
      previousValidPublished: null,
    },
  ]);
}

async function serverProcessNextDirtyEntity_changingValidationsWithInvalidPublishedEntity({
  clientProvider,
  server,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();

  const { entity, validations } = (
    await createInvalidEntity(server, adminClient, { required: null }, { publish: true })
  ).valueOrThrow();

  assertEquals(validations, [
    {
      id: entity.id,
      valid: true,
      validPublished: false,
      previousValid: true,
      previousValidPublished: true,
    },
  ]);
}

async function serverProcessNextDirtyEntity_changingValidationsWithInvalidComponent({
  clientProvider,
  server,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();

  const { entity, validations } = (
    await createEntityWithInvalidComponent(server, adminClient)
  ).valueOrThrow();

  assertEquals(validations, [
    {
      id: entity.id,
      valid: false,
      validPublished: null,
      previousValid: true,
      previousValidPublished: null,
    },
  ]);
}
