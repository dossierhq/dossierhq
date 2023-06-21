import type { EntityReference } from '@dossierhq/core';
import type { Server } from '@dossierhq/server';
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

  const entity = (
    await createInvalidEntity(
      server,
      adminClient,
      { matchPattern: 'no match' },
      { skipProcessDirtyEntities: true }
    )
  ).valueOrThrow();

  const validations = await validateAllEntitiesAndCaptureResultsForEntity(server, entity);
  assertEquals(validations, [{ id: entity.id, valid: false, validPublished: null }]);
}

async function serverProcessNextDirtyEntity_changingValidationsWithInvalidPublishedEntity({
  server,
}: SchemaTestContext) {
  const adminClient = adminClientForMainPrincipal(server);

  const entity = (
    await createInvalidEntity(
      server,
      adminClient,
      { required: null },
      { publish: true, skipProcessDirtyEntities: true }
    )
  ).valueOrThrow();

  const validations = await validateAllEntitiesAndCaptureResultsForEntity(server, entity);
  assertEquals(validations, [{ id: entity.id, valid: true, validPublished: false }]);
}

async function serverProcessNextDirtyEntity_changingValidationsWithInvalidValueItem({
  server,
}: SchemaTestContext) {
  const adminClient = adminClientForMainPrincipal(server);

  const entity = (
    await createEntityWithInvalidValueItem(server, adminClient, {
      skipProcessDirtyEntities: true,
    })
  ).valueOrThrow();

  const validations = await validateAllEntitiesAndCaptureResultsForEntity(server, entity);
  assertEquals(validations, [{ id: entity.id, valid: false, validPublished: null }]);
}

async function validateAllEntitiesAndCaptureResultsForEntity(
  server: Server,
  reference: EntityReference
) {
  const result: { id: string; valid: boolean; validPublished: boolean | null }[] = [];

  let done = false;
  while (!done) {
    const processResult = await server.processNextDirtyEntity();
    assertOkResult(processResult);
    if (!processResult.value) {
      done = true;
    }

    if (processResult.value && processResult.value.id === reference.id) {
      result.push(processResult.value);
    }
  }

  return result;
}
