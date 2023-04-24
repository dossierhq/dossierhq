import type { Server } from '@dossierhq/server';
import { assertOkResult, assertResultValue, assertTruthy } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import { createInvalidEntity } from '../shared-entity/InvalidEntityUtils.js';
import { adminClientForMainPrincipal } from '../shared-entity/TestClients.js';
import type { SchemaTestContext } from './SchemaTestSuite.js';

export const ServerRevalidateNextEntitySubSuite: UnboundTestFunction<SchemaTestContext>[] = [
  serverRevalidateNextEntity_all,
  serverRevalidateNextEntity_changingValidationsWithInvalidEntity,
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

  const entity = await createInvalidEntity(server, adminClient, {
    skipRevalidateAllEntities: true,
  });

  // revalidate all entities
  let entityValidationResult: Awaited<ReturnType<Server['revalidateNextEntity']>> | null = null;

  let done = false;
  while (!done) {
    const validationResult = await server.revalidateNextEntity();
    assertOkResult(validationResult);
    if (!validationResult.value) {
      done = true;
    }

    if (validationResult.value && validationResult.value.id === entity.id) {
      entityValidationResult = validationResult;
    }
  }

  // check that the entity was marked as invalid
  assertTruthy(entityValidationResult);
  assertResultValue(entityValidationResult, { id: entity.id, valid: false });
}
