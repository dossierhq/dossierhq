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
  // updateSchemaSpecification_adminOnlyValueTypeMakesPublishedEntityInvalid,
  // updateSchemaSpecification_adminOnlyValueTypeRemovesFromIndex,
  updateSchemaSpecification_adminOnlyFieldMakesPublishedEntityValid,
  updateSchemaSpecification_adminOnlyFieldRemovesFromIndex,
  updateSchemaSpecification_deleteFieldOnEntity,
  updateSchemaSpecification_deleteFieldOnEntityAndReplaceWithAnotherField,
  updateSchemaSpecification_deleteFieldOnEntityInvalidBecomesValid,
  updateSchemaSpecification_deleteFieldOnEntityIndexesUpdated,
  updateSchemaSpecification_deleteFieldOnValueItem,
  updateSchemaSpecification_deleteFieldOnValueItemIndexesUpdated,
  updateSchemaSpecification_renameFieldOnEntity,
  updateSchemaSpecification_renameFieldOnEntityAndReplaceWithAnotherField,
  updateSchemaSpecification_renameFieldOnValueItem,
  updateSchemaSpecification_errorWrongVersion,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function updateSchemaSpecification_adminOnlyValueTypeMakesPublishedEntityInvalid({
  server,
}: SchemaTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // Create entity
    const {
      entity: { id: entityId },
    } = (
      await adminClient.createEntity(
        copyEntity(VALUE_ITEMS_CREATE, {
          fields: { any: { type: 'ChangeValidationsValueItem', matchPattern: null } },
        }),
        { publish: true },
      )
    ).valueOrThrow();

    // Make the value item adminOnly
    assertOkResult(
      await adminClient.updateSchemaSpecification({
        valueTypes: [{ name: 'ChangeValidationsValueItem', adminOnly: true, fields: [] }],
      }),
    );

    // Process all entities
    assertOkResult(await processAllDirtyEntities(server, { id: entityId }));

    // Check that the entity is invalid
    const publishedEntity = (await publishedClient.getEntity({ id: entityId })).valueOrThrow();
    assertEquals(publishedEntity.info.valid, false);

    // Make the value item normal
    assertOkResult(
      await adminClient.updateSchemaSpecification({
        valueTypes: [{ name: 'ChangeValidationsValueItem', adminOnly: false, fields: [] }],
      }),
    );

    return ok(entityId);
  });
  assertOkResult(result);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function updateSchemaSpecification_adminOnlyValueTypeRemovesFromIndex({
  server,
}: SchemaTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const query: Parameters<(typeof publishedClient)['searchEntities']>[0] = {
    entityTypes: ['ValueItems'],
    text: 'baz',
  };

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // Create entity
    const {
      entity: { id: entityId },
    } = (
      await adminClient.createEntity(
        copyEntity(VALUE_ITEMS_CREATE, {
          fields: { any: { type: 'ChangeValidationsValueItem', matchPattern: 'baz' } },
        }),
        { publish: true },
      )
    ).valueOrThrow();

    // Check that it's in the index
    const countBeforeSchemaUpdate = (
      await countSearchResultWithEntity(publishedClient, query, entityId)
    ).valueOrThrow();
    assertEquals(countBeforeSchemaUpdate, 1);

    // Make the value item adminOnly
    assertOkResult(
      await adminClient.updateSchemaSpecification({
        valueTypes: [{ name: 'ChangeValidationsValueItem', adminOnly: true, fields: [] }],
      }),
    );

    // Process all entities
    assertOkResult(await processAllDirtyEntities(server, { id: entityId }));

    // Check that it's no longer in the index
    const countAfterSchemaUpdate = (
      await countSearchResultWithEntity(publishedClient, query, entityId)
    ).valueOrThrow();
    assertEquals(countAfterSchemaUpdate, 0);

    // Make the value item normal
    assertOkResult(
      await adminClient.updateSchemaSpecification({
        valueTypes: [{ name: 'ChangeValidationsValueItem', adminOnly: false, fields: [] }],
      }),
    );

    return ok(entityId);
  });
  assertOkResult(result);
}

async function updateSchemaSpecification_adminOnlyFieldMakesPublishedEntityValid({
  server,
}: SchemaTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);
  const fieldName = `field${new Date().getTime()}`;

  // Lock since the version needs to be consecutive
  const entityResult = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new field
    assertOkResult(
      await adminClient.updateSchemaSpecification({
        entityTypes: [{ name: 'MigrationEntity', fields: [{ name: fieldName, type: 'String' }] }],
      }),
    );

    // Create entity without the new field
    const {
      entity: { id: entityId },
    } = (
      await adminClient.createEntity(MIGRATIONS_ENTITY_CREATE, { publish: true })
    ).valueOrThrow();

    // Make it required
    assertOkResult(
      await adminClient.updateSchemaSpecification({
        entityTypes: [
          {
            name: 'MigrationEntity',
            fields: [{ name: fieldName, type: 'String', required: true }],
          },
        ],
      }),
    );

    // Process all entities
    assertOkResult(await processAllDirtyEntities(server, { id: entityId }));

    // Check that the entity is invalid
    const publishedEntity = (await publishedClient.getEntity({ id: entityId })).valueOrThrow();
    assertEquals(publishedEntity.info.valid, false);

    // Make the field adminOnly
    assertOkResult(
      await adminClient.updateSchemaSpecification({
        entityTypes: [
          {
            name: 'MigrationEntity',
            fields: [{ name: fieldName, type: 'String', adminOnly: true }],
          },
        ],
      }),
    );

    // Process all entities
    assertOkResult(await processAllDirtyEntities(server, { id: entityId }));

    return ok(entityId);
  });
  assertOkResult(entityResult);
  const entityId = entityResult.value;

  // Check that the entity is valid
  const publishedEntity = (await publishedClient.getEntity({ id: entityId })).valueOrThrow();
  assertEquals(publishedEntity.info.valid, true);
}

async function updateSchemaSpecification_adminOnlyFieldRemovesFromIndex({
  server,
}: SchemaTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);
  const fieldName = `field${new Date().getTime()}`;

  const query: Parameters<(typeof publishedClient)['searchEntities']>[0] = {
    entityTypes: ['MigrationEntity'],
    text: 'Scrumptious',
  };

  // Lock since the version needs to be consecutive
  const entityResult = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new field
    assertOkResult(
      await adminClient.updateSchemaSpecification({
        entityTypes: [{ name: 'MigrationEntity', fields: [{ name: fieldName, type: 'String' }] }],
      }),
    );

    // Create entity
    const {
      entity: { id: entityId },
    } = (
      await adminClient.createEntity(
        copyEntity(MIGRATIONS_ENTITY_CREATE, { fields: { [fieldName]: query.text } }),
        { publish: true },
      )
    ).valueOrThrow();

    // Check that it's in the index
    const countBeforeSchemaUpdate = (
      await countSearchResultWithEntity(publishedClient, query, entityId)
    ).valueOrThrow();
    assertEquals(countBeforeSchemaUpdate, 1);

    // Make the field adminOnly
    assertOkResult(
      await adminClient.updateSchemaSpecification({
        entityTypes: [
          {
            name: 'MigrationEntity',
            fields: [{ name: fieldName, type: 'String', adminOnly: true }],
          },
        ],
      }),
    );

    // Process all entities
    assertOkResult(await processAllDirtyEntities(server, { id: entityId }));

    return ok(entityId);
  });
  const entityId = entityResult.valueOrThrow();

  // Check that it's no longer in the index
  const countAfterSchemaUpdate = (
    await countSearchResultWithEntity(publishedClient, query, entityId)
  ).valueOrThrow();
  assertEquals(countAfterSchemaUpdate, 0);
}

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
        copyEntity(MIGRATIONS_ENTITY_CREATE, { fields: { [fieldName]: 'value' } }),
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

async function updateSchemaSpecification_deleteFieldOnEntityInvalidBecomesValid({
  server,
}: SchemaTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const fieldName = `field${new Date().getTime()}`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new field
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      entityTypes: [{ name: 'MigrationEntity', fields: [{ name: fieldName, type: 'String' }] }],
    });
    assertOkResult(firstUpdateResult);

    // Create entity with the new field set
    const { entity } = (
      await adminClient.createEntity(
        copyEntity(MIGRATIONS_ENTITY_CREATE, {
          fields: { [fieldName]: 'this value will become invalid' },
        }),
        { publish: true },
      )
    ).valueOrThrow();

    // Change validations to make the field invalid
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      entityTypes: [
        {
          name: 'MigrationEntity',
          fields: [{ name: fieldName, type: 'String', values: [{ value: 'valid' }] }],
        },
      ],
    });
    const { schemaSpecification } = secondUpdateResult.valueOrThrow();

    // Process all entities
    const validationChangeProcessed: {
      id: string;
      valid: boolean;
      validPublished: boolean | null;
    }[] = [];
    const processAfterValidationChangeResult = await processAllDirtyEntities(
      server,
      { id: entity.id },
      (processed) => {
        if (processed.id === entity.id) {
          validationChangeProcessed.push(processed);
        }
      },
    );
    assertOkResult(processAfterValidationChangeResult);
    assertEquals(validationChangeProcessed, [
      { id: entity.id, valid: false, validPublished: false },
    ]);

    // Delete the field
    const thirdUpdateResult = await adminClient.updateSchemaSpecification({
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [{ action: 'deleteField', entityType: 'MigrationEntity', field: fieldName }],
        },
      ],
    });
    assertOkResult(thirdUpdateResult);

    // Process all entities
    const deleteFieldProcessed: { id: string; valid: boolean; validPublished: boolean | null }[] =
      [];
    const processAfterDeletionResult = await processAllDirtyEntities(
      server,
      { id: entity.id },
      (processed) => {
        if (processed.id === entity.id) {
          deleteFieldProcessed.push(processed);
        }
      },
    );
    assertOkResult(processAfterDeletionResult);
    assertEquals(deleteFieldProcessed, [{ id: entity.id, valid: true, validPublished: true }]);

    return ok(entity);
  });
  assertOkResult(result);
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
    const processResult = await processAllDirtyEntities(server, { id: entity.id });
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
    assertOkResult(await processAllDirtyEntities(server, { id: entity.id }));

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
