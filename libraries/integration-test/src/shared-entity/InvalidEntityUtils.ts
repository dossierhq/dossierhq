import { assertOkResult, copyEntity, type AdminClient } from '@dossierhq/core';
import type { Server } from '@dossierhq/server';
import {
  ChangeValidationsWithoutValidationsUpdate,
  IntegrationTestSchema,
} from '../IntegrationTestSchema.js';
import { CHANGE_VALIDATIONS_CREATE } from './Fixtures.js';

export async function createInvalidEntity(
  server: Server,
  adminClient: AdminClient,
  { skipRevalidateAllEntities }: { skipRevalidateAllEntities?: boolean } = {}
) {
  // remove validations from the schema
  const removeValidationsResult = await adminClient.updateSchemaSpecification(
    ChangeValidationsWithoutValidationsUpdate
  );
  assertOkResult(removeValidationsResult);

  // create an entity that should be invalid
  const createEntityResult = await adminClient.createEntity(
    copyEntity(CHANGE_VALIDATIONS_CREATE, { fields: { matchPattern: 'no match' } })
  );
  assertOkResult(createEntityResult);

  // restore validations to the schema
  const restoreSchemaResult = await adminClient.updateSchemaSpecification(IntegrationTestSchema);
  assertOkResult(restoreSchemaResult);

  if (skipRevalidateAllEntities !== true) {
    let done = false;
    while (!done) {
      const validationResult = await server.revalidateNextEntity();
      assertOkResult(validationResult);
      if (!validationResult.value) {
        done = true;
      }
    }
  }

  return createEntityResult.value.entity;
}
