import {
  ErrorType,
  FieldType,
  copyEntity,
  ok,
  type AdminEntity,
  type ValueItem,
} from '@dossierhq/core';
import { assertEquals, assertErrorResult, assertOkResult } from '../Asserts.js';
import { type UnboundTestFunction } from '../Builder.js';
import { assertIsAdminValueItems, assertIsPublishedValueItems } from '../SchemaTypes.js';
import { MIGRATIONS_ENTITY_CREATE, VALUE_ITEMS_CREATE } from '../shared-entity/Fixtures.js';
import {
  processAllDirtyEntities,
  withSchemaAdvisoryLock,
} from '../shared-entity/SchemaTestUtils.js';
import { countSearchResultWithEntity } from '../shared-entity/SearchTestUtils.js';
import {
  adminClientForMainPrincipal,
  publishedClientForMainPrincipal,
} from '../shared-entity/TestClients.js';
import type { SchemaTestContext } from './SchemaTestSuite.js';

export const SchemaUpdateSchemaSpecificationSubSuite: UnboundTestFunction<SchemaTestContext>[] = [
  updateSchemaSpecification_deleteFieldOnEntity,
  updateSchemaSpecification_deleteFieldOnEntityAndReplaceWithAnotherField,
  updateSchemaSpecification_deleteFieldOnEntityIndexesUpdated,
  updateSchemaSpecification_deleteFieldOnValueItem,
  updateSchemaSpecification_deleteFieldOnValueItemIndexesUpdated,
  updateSchemaSpecification_renameFieldOnEntity,
  updateSchemaSpecification_renameFieldOnEntityAndReplaceWithAnotherField,
  updateSchemaSpecification_renameFieldOnValueItem,
  updateSchemaSpecification_errorWrongVersion,
];

async function updateSchemaSpecification_deleteFieldOnEntity({ server }: SchemaTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);
  const fieldName = `field${new Date().getTime()}`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new field
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      entityTypes: [{ name: 'MigrationEntity', fields: [{ name: fieldName, type: 'String' }] }],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the new field set
    const { entity } = (
      await adminClient.createEntity(
        {
          info: { name: fieldName, type: 'MigrationEntity', authKey: 'none' },
          fields: { [fieldName]: 'value' },
        },
        { publish: true },
      )
    ).valueOrThrow();

    // Delete the field
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [{ action: 'deleteField', entityType: 'MigrationEntity', field: fieldName }],
        },
      ],
    });
    assertOkResult(secondUpdateResult);
    return ok(entity);
  });
  assertOkResult(result);

  // Check that the field is removed
  const entityAfterMigration = (
    await adminClient.getEntity({ id: result.value.id })
  ).valueOrThrow();
  assertEquals(fieldName in entityAfterMigration.fields, false);

  // And in published entity
  const publishedEntityAfterMigration = (
    await publishedClient.getEntity({ id: result.value.id })
  ).valueOrThrow();
  assertEquals(fieldName in publishedEntityAfterMigration.fields, false);

  // Ensure it's not possible to use the field
  const updateResult = await adminClient.updateEntity(
    {
      id: result.value.id,
      fields: { [fieldName]: 'new value' },
    },
    { publish: true },
  );
  assertErrorResult(updateResult, ErrorType.BadRequest, `Unsupported field names: ${fieldName}`);
}

async function updateSchemaSpecification_deleteFieldOnEntityAndReplaceWithAnotherField({
  server,
}: SchemaTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);
  const fieldName = `field${new Date().getTime()}`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new field
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      entityTypes: [
        { name: 'MigrationEntity', fields: [{ name: fieldName, type: FieldType.String }] },
      ],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the new field set
    const { entity } = (
      await adminClient.createEntity(
        copyEntity(MIGRATIONS_ENTITY_CREATE, { fields: { [fieldName]: 'value' } }),
        { publish: true },
      )
    ).valueOrThrow();

    // Delete/replace the field
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      entityTypes: [
        {
          name: 'MigrationEntity',
          fields: [{ name: fieldName, type: FieldType.Location, list: true }],
        },
      ],
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [{ action: 'deleteField', entityType: 'MigrationEntity', field: fieldName }],
        },
      ],
    });
    assertOkResult(secondUpdateResult);
    return ok(entity);
  });
  assertOkResult(result);
  const entity = result.value;

  // Check that the field is reset
  const entityAfterMigration = (
    await adminClient.getEntity({ id: entity.id })
  ).valueOrThrow() as AdminEntity;
  assertEquals(entityAfterMigration.fields[fieldName], null);

  // And for published entity
  const publishedEntityAfterMigration = (
    await publishedClient.getEntity({ id: entity.id })
  ).valueOrThrow() as AdminEntity;
  assertEquals(publishedEntityAfterMigration.fields[fieldName], null);

  // Check that the new field is usable
  const updatedEntity = (
    await adminClient.updateEntity(
      { id: entity.id, fields: { [fieldName]: [{ lat: 1, lng: 2 }] } },
      { publish: true },
    )
  ).valueOrThrow().entity as AdminEntity;
  assertEquals(updatedEntity.fields[fieldName], [{ lat: 1, lng: 2 }]);
}

async function updateSchemaSpecification_deleteFieldOnEntityIndexesUpdated({
  server,
}: SchemaTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const fieldName = `field${new Date().getTime()}`;

  const query: Parameters<(typeof adminClient)['searchEntities']>[0] = {
    entityTypes: ['MigrationEntity'],
    text: 'Supercalifragilisticexpialidocious',
  };

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new field
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      entityTypes: [{ name: 'MigrationEntity', fields: [{ name: fieldName, type: 'String' }] }],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the new field set
    const { entity } = (
      await adminClient.createEntity(
        copyEntity(MIGRATIONS_ENTITY_CREATE, { fields: { [fieldName]: query.text } }),
      )
    ).valueOrThrow();

    // Check that it's in the index
    const countBeforeSchemaUpdate = (
      await countSearchResultWithEntity(adminClient, query, entity.id)
    ).valueOrThrow();
    assertEquals(countBeforeSchemaUpdate, 1);

    // Delete the field
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [{ action: 'deleteField', entityType: 'MigrationEntity', field: fieldName }],
        },
      ],
    });
    assertOkResult(secondUpdateResult);

    // Process all entities
    const processResult = await processAllDirtyEntities(server);
    assertOkResult(processResult);

    return ok(entity);
  });
  assertOkResult(result);

  // Check that it's no longer in the index
  const countAfterSchemaUpdate = (
    await countSearchResultWithEntity(adminClient, query, result.value.id)
  ).valueOrThrow();
  assertEquals(countAfterSchemaUpdate, 0);
}

async function updateSchemaSpecification_deleteFieldOnValueItem({ server }: SchemaTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);
  const fieldName = `field${new Date().getTime()}`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new field
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      valueTypes: [{ name: 'MigrationValueItem', fields: [{ name: fieldName, type: 'String' }] }],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the new field set
    const { entity } = (
      await adminClient.createEntity(
        copyEntity(VALUE_ITEMS_CREATE, {
          fields: { any: { type: 'MigrationValueItem', [fieldName]: 'value' } },
        }),
        { publish: true },
      )
    ).valueOrThrow();

    // Delete the field
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [{ action: 'deleteField', valueType: 'MigrationValueItem', field: fieldName }],
        },
      ],
    });
    assertOkResult(secondUpdateResult);
    return ok(entity);
  });
  assertOkResult(result);

  // Check that the field is removed
  const entityAfterMigration = (
    await adminClient.getEntity({ id: result.value.id })
  ).valueOrThrow();
  assertIsAdminValueItems(entityAfterMigration);
  const adminValueItem = entityAfterMigration.fields.any as ValueItem;
  assertEquals(adminValueItem.type, 'MigrationValueItem');
  assertEquals(fieldName in adminValueItem, false);

  // And in published entity
  const publishedEntityAfterMigration = (
    await publishedClient.getEntity({ id: result.value.id })
  ).valueOrThrow();
  assertIsPublishedValueItems(publishedEntityAfterMigration);
  const publishedValueItem = publishedEntityAfterMigration.fields.any as ValueItem;
  assertEquals(publishedValueItem.type, 'MigrationValueItem');
  assertEquals(fieldName in publishedValueItem, false);

  // Ensure it's not possible to use the field
  const updateResult = await adminClient.updateEntity(
    {
      id: result.value.id,
      fields: { any: { type: 'MigrationValueItem', [fieldName]: 'new value' } },
    },
    { publish: true },
  );
  assertErrorResult(
    updateResult,
    ErrorType.BadRequest,
    `entity.fields.any: Unsupported field names: ${fieldName}`,
  );
}

async function updateSchemaSpecification_deleteFieldOnValueItemIndexesUpdated({
  server,
}: SchemaTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const fieldName = `field${new Date().getTime()}`;

  const query: Parameters<(typeof adminClient)['searchEntities']>[0] = {
    entityTypes: ['ValueItems'],
    text: 'Copyrightable',
  };

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new field
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      valueTypes: [{ name: 'MigrationValueItem', fields: [{ name: fieldName, type: 'String' }] }],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the new field set
    const { entity } = (
      await adminClient.createEntity(
        copyEntity(VALUE_ITEMS_CREATE, {
          fields: { any: { type: 'MigrationValueItem', [fieldName]: query.text } },
        }),
      )
    ).valueOrThrow();

    // Check that it's in the index
    const countBeforeSchemaUpdate = (
      await countSearchResultWithEntity(adminClient, query, entity.id)
    ).valueOrThrow();
    assertEquals(countBeforeSchemaUpdate, 1);

    // Delete the field
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [{ action: 'deleteField', valueType: 'MigrationValueItem', field: fieldName }],
        },
      ],
    });
    assertOkResult(secondUpdateResult);

    // Process all entities
    const processResult = await processAllDirtyEntities(server);
    assertOkResult(processResult);

    return ok(entity);
  });
  assertOkResult(result);

  // Check that it's no longer in the index
  const countAfterSchemaUpdate = (
    await countSearchResultWithEntity(adminClient, query, result.value.id)
  ).valueOrThrow();
  assertEquals(countAfterSchemaUpdate, 0);
}

async function updateSchemaSpecification_renameFieldOnEntity({ server }: SchemaTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);
  const oldFieldName = `field${new Date().getTime()}`;
  const newFieldName = `${oldFieldName}New`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new field
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      entityTypes: [{ name: 'MigrationEntity', fields: [{ name: oldFieldName, type: 'String' }] }],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the new field set
    const { entity } = (
      await adminClient.createEntity(
        copyEntity(MIGRATIONS_ENTITY_CREATE, { fields: { [oldFieldName]: 'value' } }),
        { publish: true },
      )
    ).valueOrThrow();

    // Rename the field
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [
            {
              action: 'renameField',
              entityType: 'MigrationEntity',
              field: oldFieldName,
              newName: newFieldName,
            },
          ],
        },
      ],
    });
    assertOkResult(secondUpdateResult);
    return ok(entity);
  });
  assertOkResult(result);
  const entityId = result.value.id;

  // Check that the field is renamed
  const entityAfterMigration = (
    await adminClient.getEntity({ id: entityId })
  ).valueOrThrow() as AdminEntity;
  assertEquals(oldFieldName in entityAfterMigration.fields, false);
  assertEquals(entityAfterMigration.fields[newFieldName], 'value');

  // And in published entity
  const publishedEntityAfterMigration = (
    await publishedClient.getEntity({ id: entityId })
  ).valueOrThrow() as AdminEntity;
  assertEquals(oldFieldName in publishedEntityAfterMigration.fields, false);
  assertEquals(publishedEntityAfterMigration.fields[newFieldName], 'value');

  // Check that the new name is usable
  const updatedNewNameEntity = (
    await adminClient.updateEntity(
      { id: entityId, fields: { [newFieldName]: 'updated value' } },
      { publish: true },
    )
  ).valueOrThrow().entity as AdminEntity;
  assertEquals(updatedNewNameEntity.fields[newFieldName], 'updated value');

  // Check that the old name is not usable
  const updatedOldNameResult = await adminClient.updateEntity(
    { id: entityId, fields: { [oldFieldName]: 'updated value' } },
    { publish: true },
  );
  assertErrorResult(
    updatedOldNameResult,
    ErrorType.BadRequest,
    `Unsupported field names: ${oldFieldName}`,
  );
}

async function updateSchemaSpecification_renameFieldOnEntityAndReplaceWithAnotherField({
  server,
}: SchemaTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);
  const oldFieldName = `field${new Date().getTime()}`;
  const newFieldName = `${oldFieldName}New`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new field
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      entityTypes: [
        { name: 'MigrationEntity', fields: [{ name: oldFieldName, type: FieldType.String }] },
      ],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the new field set
    const { entity } = (
      await adminClient.createEntity(
        copyEntity(MIGRATIONS_ENTITY_CREATE, { fields: { [oldFieldName]: 'value' } }),
        { publish: true },
      )
    ).valueOrThrow();

    // Rename/replace the field
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      entityTypes: [
        {
          name: 'MigrationEntity',
          fields: [{ name: oldFieldName, type: FieldType.Location, list: true }],
        },
      ],
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [
            {
              action: 'renameField',
              entityType: 'MigrationEntity',
              field: oldFieldName,
              newName: newFieldName,
            },
          ],
        },
      ],
    });
    assertOkResult(secondUpdateResult);
    return ok(entity);
  });
  assertOkResult(result);
  const entity = result.value;

  // Check that the renamed field got the old value and the original field is reset
  const entityAfterMigration = (
    await adminClient.getEntity({ id: entity.id })
  ).valueOrThrow() as AdminEntity;
  assertEquals(entityAfterMigration.fields[oldFieldName], null);
  assertEquals(entityAfterMigration.fields[newFieldName], 'value');

  // And for published entity
  const publishedEntityAfterMigration = (
    await publishedClient.getEntity({ id: entity.id })
  ).valueOrThrow() as AdminEntity;
  assertEquals(publishedEntityAfterMigration.fields[oldFieldName], null);
  assertEquals(publishedEntityAfterMigration.fields[newFieldName], 'value');

  // Check that both fields are usable
  const updatedEntity = (
    await adminClient.updateEntity(
      {
        id: entity.id,
        fields: { [oldFieldName]: [{ lat: 1, lng: 2 }], [newFieldName]: 'updated value' },
      },
      { publish: true },
    )
  ).valueOrThrow().entity as AdminEntity;
  assertEquals(updatedEntity.fields[oldFieldName], [{ lat: 1, lng: 2 }]);
  assertEquals(updatedEntity.fields[newFieldName], 'updated value');
}

async function updateSchemaSpecification_renameFieldOnValueItem({ server }: SchemaTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);
  const oldFieldName = `field${new Date().getTime()}`;
  const newFieldName = `${oldFieldName}New`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new field
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      valueTypes: [
        { name: 'MigrationValueItem', fields: [{ name: oldFieldName, type: 'String' }] },
      ],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the new field set
    const { entity } = (
      await adminClient.createEntity(
        copyEntity(VALUE_ITEMS_CREATE, {
          fields: { any: { type: 'MigrationValueItem', [oldFieldName]: 'value' } },
        }),
        { publish: true },
      )
    ).valueOrThrow();

    // Rename the field
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [
            {
              action: 'renameField',
              valueType: 'MigrationValueItem',
              field: oldFieldName,
              newName: newFieldName,
            },
          ],
        },
      ],
    });
    assertOkResult(secondUpdateResult);
    return ok(entity);
  });
  assertOkResult(result);
  const entityId = result.value.id;

  // Check that the field is renamed
  const entityAfterMigration = (
    await adminClient.getEntity({ id: entityId })
  ).valueOrThrow() as AdminEntity;
  const valueItemAfterMigration = entityAfterMigration.fields.any as ValueItem;
  assertEquals(oldFieldName in valueItemAfterMigration, false);
  assertEquals(valueItemAfterMigration[newFieldName], 'value');

  // And in published entity
  const publishedEntityAfterMigration = (
    await publishedClient.getEntity({ id: entityId })
  ).valueOrThrow() as AdminEntity;
  const publishedValueItem = publishedEntityAfterMigration.fields.any as ValueItem;
  assertEquals(oldFieldName in publishedValueItem, false);
  assertEquals(publishedValueItem[newFieldName], 'value');

  // Check that the new name is usable
  const updatedNewNameEntity = (
    await adminClient.updateEntity(
      {
        id: entityId,
        fields: { any: { type: 'MigrationValueItem', [newFieldName]: 'updated value' } },
      },
      { publish: true },
    )
  ).valueOrThrow().entity as AdminEntity;
  assertEquals((updatedNewNameEntity.fields.any as ValueItem)[newFieldName], 'updated value');

  // Check that the old name is not usable
  const updatedOldNameResult = await adminClient.updateEntity(
    {
      id: entityId,
      fields: { any: { type: 'MigrationValueItem', [oldFieldName]: 'updated value' } },
    },
    { publish: true },
  );
  assertErrorResult(
    updatedOldNameResult,
    ErrorType.BadRequest,
    `entity.fields.any: Unsupported field names: ${oldFieldName}`,
  );
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
