import { assertEquals } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import {
  createEntityWithInvalidComponent,
  createInvalidEntity,
} from '../shared-entity/InvalidEntityUtils.js';
import type { SchemaTestContext } from './SchemaTestSuite.js';

export const ServerProcessNextDirtyEntitySubSuite: UnboundTestFunction<SchemaTestContext>[] = [
  serverProcessNextDirtyEntity_changingValidationsWithInvalidEntity,
  serverProcessNextDirtyEntity_changingValidationsWithInvalidPublishedEntity,
  serverProcessNextDirtyEntity_changingValidationsWithInvalidComponent,
];

async function serverProcessNextDirtyEntity_changingValidationsWithInvalidEntity({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();

  const { entity, validations } = (
    await createInvalidEntity(adminClient, { matchPattern: 'no match' })
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
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();

  const { entity, validations } = (
    await createInvalidEntity(adminClient, { required: null }, { publish: true })
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
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();

  const { entity, validations } = (
    await createEntityWithInvalidComponent(adminClient)
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
