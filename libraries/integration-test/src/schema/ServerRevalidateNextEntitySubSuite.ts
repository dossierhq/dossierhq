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

export const ServerRevalidateNextEntitySubSuite: UnboundTestFunction<SchemaTestContext>[] = [
  serverRevalidateNextEntity_all,
  serverRevalidateNextEntity_changingValidationsWithInvalidEntity,
  serverRevalidateNextEntity_changingValidationsWithInvalidValueItem,
];

async function serverRevalidateNextEntity_all({ server }: SchemaTestContext) {
  let done = false;
  while (!done) {
    const result = await server.revalidateNextEntity();
    assertOkResult(result);
    if (!result.value) {
      done = true;
    }
  }
}

async function serverRevalidateNextEntity_changingValidationsWithInvalidEntity({
  server,
}: SchemaTestContext) {
  const adminClient = adminClientForMainPrincipal(server);

  const entity = (
    await createInvalidEntity(server, adminClient, {
      skipRevalidateAllEntities: true,
    })
  ).valueOrThrow();

  const validations = await validateAllEntitiesAndCaptureResultsForEntity(server, entity);
  assertEquals(validations, [{ id: entity.id, valid: false }]);
}

async function serverRevalidateNextEntity_changingValidationsWithInvalidValueItem({
  server,
}: SchemaTestContext) {
  const adminClient = adminClientForMainPrincipal(server);

  const entity = (
    await createEntityWithInvalidValueItem(server, adminClient, {
      skipRevalidateAllEntities: true,
    })
  ).valueOrThrow();

  const validations = await validateAllEntitiesAndCaptureResultsForEntity(server, entity);
  assertEquals(validations, [{ id: entity.id, valid: false }]);
}

async function validateAllEntitiesAndCaptureResultsForEntity(
  server: Server,
  reference: EntityReference
) {
  const result: { id: string; valid: boolean }[] = [];

  let done = false;
  while (!done) {
    const validationResult = await server.revalidateNextEntity();
    assertOkResult(validationResult);
    if (!validationResult.value) {
      done = true;
    }

    if (validationResult.value && validationResult.value.id === reference.id) {
      result.push(validationResult.value);
    }
  }

  return result;
}
