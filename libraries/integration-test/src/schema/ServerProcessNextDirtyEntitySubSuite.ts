import { assertEquals, assertOkResult } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import {
  createEntityWithInvalidValueItem,
  createInvalidEntity,
} from '../shared-entity/InvalidEntityUtils.js';
import { adminClientForMainPrincipal } from '../shared-entity/TestClients.js';
import type { SchemaTestContext } from './SchemaTestSuite.js';

export const ServerProcessNextDirtyEntitySubSuite: UnboundTestFunction<SchemaTestContext>[] = [
  serverProcessNextDirtyEntity_all,
  serverProcessNextDirtyEntity_changingValidationsWithInvalidEntity,
  serverProcessNextDirtyEntity_changingValidationsWithInvalidPublishedEntity,
  serverProcessNextDirtyEntity_changingValidationsWithInvalidValueItem,
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

async function serverProcessNextDirtyEntity_changingValidationsWithInvalidEntity({
  server,
}: SchemaTestContext) {
  const adminClient = adminClientForMainPrincipal(server);

  const { entity, validations } = (
    await createInvalidEntity(server, adminClient, { matchPattern: 'no match' })
  ).valueOrThrow();

  assertEquals(validations, [{ id: entity.id, valid: false, validPublished: null }]);
}

async function serverProcessNextDirtyEntity_changingValidationsWithInvalidPublishedEntity({
  server,
}: SchemaTestContext) {
  const adminClient = adminClientForMainPrincipal(server);

  const { entity, validations } = (
    await createInvalidEntity(server, adminClient, { required: null }, { publish: true })
  ).valueOrThrow();

  assertEquals(validations, [{ id: entity.id, valid: true, validPublished: false }]);
}

async function serverProcessNextDirtyEntity_changingValidationsWithInvalidValueItem({
  server,
}: SchemaTestContext) {
  const adminClient = adminClientForMainPrincipal(server);

  const { entity, validations } = (
    await createEntityWithInvalidValueItem(server, adminClient)
  ).valueOrThrow();

  assertEquals(validations, [{ id: entity.id, valid: false, validPublished: null }]);
}
