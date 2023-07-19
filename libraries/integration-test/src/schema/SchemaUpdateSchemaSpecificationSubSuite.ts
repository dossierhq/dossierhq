import { ErrorType, FieldType, ok } from '@dossierhq/core';
import { assertEquals, assertErrorResult, assertOkResult } from '../Asserts.js';
import { type UnboundTestFunction } from '../Builder.js';
import { withSchemaAdvisoryLock } from '../shared-entity/SchemaTestUtils.js';
import { adminClientForMainPrincipal } from '../shared-entity/TestClients.js';
import type { SchemaTestContext } from './SchemaTestSuite.js';

export const SchemaUpdateSchemaSpecificationSubSuite: UnboundTestFunction<SchemaTestContext>[] = [
  updateSchemaSpecification_deleteFieldOnEntity,
  updateSchemaSpecification_deleteFieldOnEntityAndReplaceWithAnotherField,
  updateSchemaSpecification_errorWrongVersion,
];

async function updateSchemaSpecification_deleteFieldOnEntity({ server }: SchemaTestContext) {
  const client = adminClientForMainPrincipal(server);
  const fieldName = `field${new Date().getTime()}`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(client, async () => {
    // First add new field
    const firstUpdateResult = await client.updateSchemaSpecification({
      entityTypes: [{ name: 'MigrationEntity', fields: [{ name: fieldName, type: 'String' }] }],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the new field set
    const { entity } = (
      await client.createEntity({
        info: { name: fieldName, type: 'MigrationEntity', authKey: 'none' },
        fields: { [fieldName]: 'value' },
      })
    ).valueOrThrow();

    // Delete the field
    const secondUpdateResult = await client.updateSchemaSpecification({
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [{ action: 'deleteField', type: 'MigrationEntity', field: fieldName }],
        },
      ],
    });
    assertOkResult(secondUpdateResult);
    return ok(entity);
  });
  assertOkResult(result);

  // Check that the field is removed
  const entityAfterMigration = (await client.getEntity({ id: result.value.id })).valueOrThrow();
  assertEquals(fieldName in entityAfterMigration.fields, false);
}

async function updateSchemaSpecification_deleteFieldOnEntityAndReplaceWithAnotherField({
  server,
}: SchemaTestContext) {
  const client = adminClientForMainPrincipal(server);
  const fieldName = `field${new Date().getTime()}`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(client, async () => {
    // First add new field
    const firstUpdateResult = await client.updateSchemaSpecification({
      entityTypes: [
        { name: 'MigrationEntity', fields: [{ name: fieldName, type: FieldType.String }] },
      ],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the new field set
    const { entity } = (
      await client.createEntity({
        info: { name: fieldName, type: 'MigrationEntity', authKey: 'none' },
        fields: { [fieldName]: 'value' },
      })
    ).valueOrThrow();

    // Delete/replace the field
    const secondUpdateResult = await client.updateSchemaSpecification({
      entityTypes: [
        {
          name: 'MigrationEntity',
          fields: [{ name: fieldName, type: FieldType.Location, list: true }],
        },
      ],
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [{ action: 'deleteField', type: 'MigrationEntity', field: fieldName }],
        },
      ],
    });
    assertOkResult(secondUpdateResult);
    return ok(entity);
  });
  assertOkResult(result);
  const entity = result.value;

  // Check that the field is reset
  const entityAfterMigration = (await client.getEntity({ id: entity.id })).valueOrThrow();
  assertEquals((entityAfterMigration.fields as Record<string, unknown>)[fieldName], null);

  // Check that the new field is usable
  (
    await client.updateEntity({ id: entity.id, fields: { [fieldName]: [{ lat: 1, lng: 2 }] } })
  ).throwIfError();
}

async function updateSchemaSpecification_errorWrongVersion({ server }: SchemaTestContext) {
  const client = adminClientForMainPrincipal(server);
  const schemaSpec = (await client.getSchemaSpecification()).valueOrThrow();
  const version = schemaSpec.version;
  const result = await client.updateSchemaSpecification({ version });
  assertErrorResult(
    result,
    ErrorType.BadRequest,
    `Expected version ${version + 1}, got ${version}`,
  );
}
