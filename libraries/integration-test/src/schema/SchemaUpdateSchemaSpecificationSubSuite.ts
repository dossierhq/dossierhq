import {
  ErrorType,
  EventType,
  FieldType,
  copyEntity,
  ok,
  type AdminEntity,
  type Component,
  type PublishedEntity,
} from '@dossierhq/core';
import {
  assertEquals,
  assertErrorResult,
  assertOkResult,
  assertResultValue,
  assertSame,
  assertTruthy,
} from '../Asserts.js';
import { type UnboundTestFunction } from '../Builder.js';
import {
  assertIsAdminComponents,
  assertIsPublishedComponents,
  type AdminComponents,
  type AppAdminComponent,
  type AppAdminEntity,
  type AppAdminUniqueIndexes,
  type AppPublishedComponent,
} from '../SchemaTypes.js';
import { assertChangelogEventsConnection } from '../shared-entity/EventsTestUtils.js';
import {
  CHANGE_VALIDATIONS_CREATE,
  MIGRATIONS_ENTITY_CREATE,
  VALUE_ITEMS_CREATE,
} from '../shared-entity/Fixtures.js';
import { withSchemaAdvisoryLock } from '../shared-entity/SchemaTestUtils.js';
import {
  collectMatchingSearchResultNodes,
  countSearchResultWithEntity,
} from '../shared-entity/SearchTestUtils.js';
import type { SchemaTestContext } from './SchemaTestSuite.js';

export const SchemaUpdateSchemaSpecificationSubSuite: UnboundTestFunction<SchemaTestContext>[] = [
  updateSchemaSpecification_removeAllFieldsFromMigrationEntity,
  updateSchemaSpecification_removeAllFieldsFromMigrationComponent,
  updateSchemaSpecification_removeAllTemporaryComponentTypes,
  //TODO updateSchemaSpecification_removeAllTemporaryEntityTypes, add when we can delete entities
  updateSchemaSpecification_updateSchemaEvent,
  updateSchemaSpecification_concurrentUpdates,
  updateSchemaSpecification_adminOnlyEntityMakesPublishedEntityInvalidAndRemovedFromFtsIndex,
  updateSchemaSpecification_adminOnlyComponentTypeMakesPublishedEntityInvalid,
  updateSchemaSpecification_adminOnlyComponentTypeRemovesFromIndex,
  updateSchemaSpecification_adminOnlyFieldMakesPublishedEntityValid,
  updateSchemaSpecification_adminOnlyFieldRemovesFromIndex,
  updateSchemaSpecification_deleteFieldOnEntity,
  updateSchemaSpecification_deleteFieldOnEntityAndReplaceWithAnotherField,
  updateSchemaSpecification_deleteFieldOnEntityInvalidBecomesValid,
  updateSchemaSpecification_deleteFieldOnEntityIndexesUpdated,
  updateSchemaSpecification_deleteFieldOnEntityUpdatesFtsIndexEvenWhenInvalid,
  updateSchemaSpecification_deleteFieldOnComponent,
  updateSchemaSpecification_deleteFieldOnComponentIndexesUpdated,
  updateSchemaSpecification_renameFieldOnEntity,
  updateSchemaSpecification_renameFieldOnEntityAndReplaceWithAnotherField,
  updateSchemaSpecification_renameFieldOnComponent,
  updateSchemaSpecification_deleteTypeOnEntityType,
  updateSchemaSpecification_deleteTypeOnTwoEntityTypes,
  updateSchemaSpecification_deleteTypeOnComponent,
  updateSchemaSpecification_deleteTypeOnComponentAndReplaceWithAnotherType,
  updateSchemaSpecification_deleteTypeOnComponentInvalidBecomesValid,
  updateSchemaSpecification_deleteTypeOnComponentIndexesUpdated,
  updateSchemaSpecification_renameTypeOnEntity,
  updateSchemaSpecification_renameTypeOnEntityAndReplaceWithAnotherType,
  updateSchemaSpecification_renameTypeOnComponent,
  updateSchemaSpecification_renameTypeOnComponentAndReplaceWithAnotherType,
  updateSchemaSpecification_renameTypeOnComponentUpdatesComponentTypeIndexes,
  updateSchemaSpecification_renameFieldAndRenameTypeOnEntity,
  updateSchemaSpecification_renameTypeAndRenameFieldOnEntity,
  updateSchemaSpecification_renameFieldAndRenameTypeOnComponent,
  updateSchemaSpecification_renameTypeAndRenameFieldOnComponent,
  updateSchemaSpecification_addingIndexToField,
  updateSchemaSpecification_deleteIndexClearsIndexDirectly,
  updateSchemaSpecification_deleteIndexMultiple,
  updateSchemaSpecification_renameIndexMaintainsLinkDirectly,
  updateSchemaSpecification_errorWrongVersion,
  updateSchemaSpecification_errorDeleteTypeOnEntityTypeWithExistingEntities,
  updateSchemaSpecification_errorReadonlySession,
];

async function updateSchemaSpecification_removeAllFieldsFromMigrationEntity({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    const schemaSpec = (
      await adminClient.getSchemaSpecification({ includeMigrations: true })
    ).valueOrThrow();

    const migrationEntitySpec = schemaSpec.entityTypes.find((it) => it.name === 'MigrationEntity');
    if (migrationEntitySpec && migrationEntitySpec.fields.length > 0) {
      const updateResult = await adminClient.updateSchemaSpecification({
        migrations: [
          {
            version: schemaSpec.version + 1,
            actions: migrationEntitySpec.fields.map((it) => ({
              action: 'deleteField',
              entityType: 'MigrationEntity',
              field: it.name,
            })),
          },
        ],
      });
      assertOkResult(updateResult);
    }
    return ok(undefined);
  });
  assertOkResult(result);
}

async function updateSchemaSpecification_removeAllFieldsFromMigrationComponent({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    const schemaSpec = (
      await adminClient.getSchemaSpecification({ includeMigrations: true })
    ).valueOrThrow();

    const migrationValueSpec = schemaSpec.componentTypes.find(
      (it) => it.name === 'MigrationComponent',
    );
    if (migrationValueSpec && migrationValueSpec.fields.length > 0) {
      const updateResult = await adminClient.updateSchemaSpecification({
        migrations: [
          {
            version: schemaSpec.version + 1,
            actions: migrationValueSpec.fields.map((it) => ({
              action: 'deleteField',
              componentType: 'MigrationComponent',
              field: it.name,
            })),
          },
        ],
      });
      assertOkResult(updateResult);
    }
    return ok(undefined);
  });
  assertOkResult(result);
}

async function updateSchemaSpecification_removeAllTemporaryComponentTypes({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    const schemaSpec = (
      await adminClient.getSchemaSpecification({ includeMigrations: true })
    ).valueOrThrow();

    const valueSpecs = schemaSpec.componentTypes.filter(
      (it) => it.name.startsWith('MigrationComponent') && it.name !== 'MigrationComponent',
    );
    if (valueSpecs.length > 0) {
      const updateResult = await adminClient.updateSchemaSpecification({
        migrations: [
          {
            version: schemaSpec.version + 1,
            actions: valueSpecs.map((it) => ({ action: 'deleteType', componentType: it.name })),
          },
        ],
      });
      assertOkResult(updateResult);
    }
    return ok(undefined);
  });
  assertOkResult(result);
}

async function updateSchemaSpecification_updateSchemaEvent({ clientProvider }: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const fieldName = `field${new Date().getTime()}`;

  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    return await adminClient.updateSchemaSpecification({
      entityTypes: [
        { name: 'MigrationEntity', fields: [{ name: fieldName, type: FieldType.String }] },
      ],
    });
  });
  const { version } = result.valueOrThrow().schemaSpecification;

  const connectionResult = await adminClient.getChangelogEvents({
    types: [EventType.updateSchema],
    reverse: true,
  });
  assertOkResult(connectionResult);
  assertTruthy(connectionResult.value);
  const eventsWithVersion = connectionResult.value.edges.filter(
    (it) =>
      it.node.isOk() &&
      it.node.value.type === EventType.updateSchema &&
      it.node.value.version === version,
  );
  assertEquals(eventsWithVersion.length, 1);
}

async function updateSchemaSpecification_concurrentUpdates({ clientProvider }: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const fieldName1 = `field${new Date().getTime()}`;
  const fieldName2 = `${fieldName1}2`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    const schemaSpec = (
      await adminClient.getSchemaSpecification({ includeMigrations: true })
    ).valueOrThrow();
    const newVersion = schemaSpec.version + 1;

    const updateOnePromise = adminClient.updateSchemaSpecification({
      version: newVersion,
      entityTypes: [
        { name: 'MigrationEntity', fields: [{ name: fieldName1, type: FieldType.Boolean }] },
      ],
    });
    const updateTwoPromise = adminClient.updateSchemaSpecification({
      version: newVersion,
      entityTypes: [
        { name: 'MigrationEntity', fields: [{ name: fieldName2, type: FieldType.String }] },
      ],
    });

    const [updateOneResult, updateTwoResult] = await Promise.all([
      updateOnePromise,
      updateTwoPromise,
    ]);

    // Since one update will finish before the other, we expect one of them to fail claiming that the version is wrong
    if (updateOneResult.isOk()) {
      assertErrorResult(
        updateTwoResult,
        ErrorType.BadRequest,
        `Expected version ${newVersion + 1}, got ${newVersion}`,
      );
    } else if (updateTwoResult.isOk()) {
      assertErrorResult(
        updateOneResult,
        ErrorType.BadRequest,
        `Expected version ${newVersion + 1}, got ${newVersion}`,
      );
    } else {
      throw new Error('Expected one of the updates to succeed');
    }
    return ok(undefined);
  });
  assertOkResult(result);
}

async function updateSchemaSpecification_adminOnlyEntityMakesPublishedEntityInvalidAndRemovedFromFtsIndex({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();

  const query: Parameters<(typeof publishedClient)['getEntities']>[0] = {
    text: 'splendid presentation',
  };

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // Create entity
    const {
      entity: { id: entityId },
    } = (
      await adminClient.createEntity(
        copyEntity(CHANGE_VALIDATIONS_CREATE, { fields: { required: query.text } }),
        { publish: true },
      )
    ).valueOrThrow();
    const reference = { id: entityId };

    // Make the entity type adminOnly
    assertOkResult(
      await adminClient.updateSchemaSpecification({
        entityTypes: [{ name: 'ChangeValidations', adminOnly: true, fields: [] }],
      }),
    );

    // Process the entity
    assertResultValue(await adminClient.processDirtyEntity(reference), {
      id: entityId,
      valid: true,
      validPublished: false,
      previousValid: true,
      previousValidPublished: true,
    });

    // Check that the entity is invalid
    const adminEntity = (await adminClient.getEntity(reference)).valueOrThrow();
    assertEquals(adminEntity.info.valid, true);
    assertEquals(adminEntity.info.validPublished, false);

    // Check that we can't get the published entity
    const publishedEntityResult = await publishedClient.getEntity(reference);
    assertErrorResult(
      publishedEntityResult,
      ErrorType.BadRequest,
      `No entity spec for type ChangeValidations (id: ${entityId})`,
    );

    // Check that it's not in the index
    const matchingNodesResult = await collectMatchingSearchResultNodes(
      publishedClient,
      query,
      (it) =>
        (it.isOk() && it.value.id === entityId) || (it.isError() && it.message.includes(entityId)),
    );
    assertResultValue(matchingNodesResult, []);

    // Make the entity type normal
    assertOkResult(
      await adminClient.updateSchemaSpecification({
        entityTypes: [{ name: 'ChangeValidations', adminOnly: false, fields: [] }],
      }),
    );

    return ok(entityId);
  });
  assertOkResult(result);
}

async function updateSchemaSpecification_adminOnlyComponentTypeMakesPublishedEntityInvalid({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // Create entity
    const {
      entity: { id: entityId },
    } = (
      await adminClient.createEntity(
        copyEntity(VALUE_ITEMS_CREATE, {
          fields: { any: { type: 'ChangeValidationsComponent', matchPattern: null } },
        }),
        { publish: true },
      )
    ).valueOrThrow();

    // Make the component adminOnly
    assertOkResult(
      await adminClient.updateSchemaSpecification({
        componentTypes: [{ name: 'ChangeValidationsComponent', adminOnly: true, fields: [] }],
      }),
    );

    // Process the entity
    assertResultValue(await adminClient.processDirtyEntity({ id: entityId }), {
      id: entityId,
      valid: true,
      validPublished: false,
      previousValid: true,
      previousValidPublished: true,
    });

    // Check that the entity is invalid
    const publishedEntity = (await publishedClient.getEntity({ id: entityId })).valueOrThrow();
    assertEquals(publishedEntity.info.valid, false);

    // Make the component normal
    assertOkResult(
      await adminClient.updateSchemaSpecification({
        componentTypes: [{ name: 'ChangeValidationsComponent', adminOnly: false, fields: [] }],
      }),
    );

    return ok(entityId);
  });
  assertOkResult(result);
}

async function updateSchemaSpecification_adminOnlyComponentTypeRemovesFromIndex({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();

  const query: Parameters<(typeof publishedClient)['getEntities']>[0] = {
    entityTypes: ['Components'],
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
          fields: {
            any: { type: 'ChangeValidationsComponent', matchPattern: query.text! },
          },
        }),
        { publish: true },
      )
    ).valueOrThrow();

    // Check that it's in the index
    const countBeforeSchemaUpdate = (
      await countSearchResultWithEntity(publishedClient, query, entityId)
    ).valueOrThrow();
    assertEquals(countBeforeSchemaUpdate, 1);

    // Make the component adminOnly
    assertOkResult(
      await adminClient.updateSchemaSpecification({
        componentTypes: [{ name: 'ChangeValidationsComponent', adminOnly: true, fields: [] }],
      }),
    );

    // Process the entity
    assertResultValue(await adminClient.processDirtyEntity({ id: entityId }), {
      id: entityId,
      valid: true,
      validPublished: false,
      previousValid: true,
      previousValidPublished: true,
    });

    // Check that it's no longer in the index
    const countAfterSchemaUpdate = (
      await countSearchResultWithEntity(publishedClient, query, entityId)
    ).valueOrThrow();
    assertEquals(countAfterSchemaUpdate, 0);

    // Make the component normal
    assertOkResult(
      await adminClient.updateSchemaSpecification({
        componentTypes: [{ name: 'ChangeValidationsComponent', adminOnly: false, fields: [] }],
      }),
    );

    return ok(entityId);
  });
  assertOkResult(result);
}

async function updateSchemaSpecification_adminOnlyFieldMakesPublishedEntityValid({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const fieldName = `field${new Date().getTime()}`;

  // Lock since the version needs to be consecutive
  const entityResult = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new field
    assertOkResult(
      await adminClient.updateSchemaSpecification({
        entityTypes: [
          { name: 'MigrationEntity', fields: [{ name: fieldName, type: FieldType.String }] },
        ],
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
            fields: [{ name: fieldName, type: FieldType.String, required: true }],
          },
        ],
      }),
    );

    // Process the entity
    assertResultValue(await adminClient.processDirtyEntity({ id: entityId }), {
      id: entityId,
      valid: true,
      validPublished: false,
      previousValid: true,
      previousValidPublished: true,
    });

    // Check that the entity is invalid
    const publishedEntity = (await publishedClient.getEntity({ id: entityId })).valueOrThrow();
    assertEquals(publishedEntity.info.valid, false);

    // Make the field adminOnly
    assertOkResult(
      await adminClient.updateSchemaSpecification({
        entityTypes: [
          {
            name: 'MigrationEntity',
            fields: [{ name: fieldName, type: FieldType.String, adminOnly: true }],
          },
        ],
      }),
    );

    // Process the entity
    assertResultValue(await adminClient.processDirtyEntity({ id: entityId }), {
      id: entityId,
      valid: true,
      validPublished: true,
      previousValid: true,
      previousValidPublished: false,
    });

    return ok(entityId);
  });
  assertOkResult(entityResult);
  const entityId = entityResult.value;

  // Check that the entity is valid
  const publishedEntity = (await publishedClient.getEntity({ id: entityId })).valueOrThrow();
  assertEquals(publishedEntity.info.valid, true);
}

async function updateSchemaSpecification_adminOnlyFieldRemovesFromIndex({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const fieldName = `field${new Date().getTime()}`;

  const query: Parameters<(typeof publishedClient)['getEntities']>[0] = {
    entityTypes: ['MigrationEntity'],
    text: 'Scrumptious',
  };

  // Lock since the version needs to be consecutive
  const entityResult = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new field
    assertOkResult(
      await adminClient.updateSchemaSpecification({
        entityTypes: [
          { name: 'MigrationEntity', fields: [{ name: fieldName, type: FieldType.String }] },
        ],
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
            fields: [{ name: fieldName, type: FieldType.String, adminOnly: true }],
          },
        ],
      }),
    );

    // Process the entity
    assertResultValue(await adminClient.processDirtyEntity({ id: entityId }), {
      id: entityId,
      valid: true,
      validPublished: true,
      previousValid: true,
      previousValidPublished: true,
    });

    return ok(entityId);
  });
  const entityId = entityResult.valueOrThrow();

  // Check that it's no longer in the index
  const countAfterSchemaUpdate = (
    await countSearchResultWithEntity(publishedClient, query, entityId)
  ).valueOrThrow();
  assertEquals(countAfterSchemaUpdate, 0);
}

async function updateSchemaSpecification_deleteFieldOnEntity({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
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
  assertErrorResult(
    updateResult,
    ErrorType.BadRequest,
    `entity.fields: MigrationEntity does not include the fields: ${fieldName}`,
  );
}

async function updateSchemaSpecification_deleteFieldOnEntityAndReplaceWithAnotherField({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
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
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const fieldName = `field${new Date().getTime()}`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new field
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      entityTypes: [
        { name: 'MigrationEntity', fields: [{ name: fieldName, type: FieldType.String }] },
      ],
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
          fields: [{ name: fieldName, type: FieldType.String, values: [{ value: 'valid' }] }],
        },
      ],
    });
    const { schemaSpecification } = secondUpdateResult.valueOrThrow();

    // Process the entity
    assertResultValue(await adminClient.processDirtyEntity({ id: entity.id }), {
      id: entity.id,
      valid: false,
      validPublished: false,
      previousValid: true,
      previousValidPublished: true,
    });

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

    // Process the entity
    assertResultValue(await adminClient.processDirtyEntity({ id: entity.id }), {
      id: entity.id,
      valid: true,
      validPublished: true,
      previousValid: false,
      previousValidPublished: false,
    });

    return ok(undefined);
  });
  assertOkResult(result);
}

async function updateSchemaSpecification_deleteFieldOnEntityIndexesUpdated({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const fieldName = `field${new Date().getTime()}`;

  const query: Parameters<(typeof adminClient)['getEntities']>[0] = {
    entityTypes: ['MigrationEntity'],
    text: 'Supercalifragilisticexpialidocious',
  };

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

    // Process the entity
    assertResultValue(await adminClient.processDirtyEntity({ id: entity.id }), {
      id: entity.id,
      valid: true,
      validPublished: null,
      previousValid: true,
      previousValidPublished: null,
    });

    return ok(entity);
  });
  assertOkResult(result);

  // Check that it's no longer in the index
  const countAfterSchemaUpdate = (
    await countSearchResultWithEntity(adminClient, query, result.value.id)
  ).valueOrThrow();
  assertEquals(countAfterSchemaUpdate, 0);
}

async function updateSchemaSpecification_deleteFieldOnEntityUpdatesFtsIndexEvenWhenInvalid({
  clientProvider,
}: SchemaTestContext) {
  // The reason why we test this is that we want to ensure that we update indexes even when an entity
  // becomes invalid.
  const adminClient = clientProvider.adminClient();
  const fieldToDeleteName = `field${new Date().getTime()}Delete`;
  const fieldToBecomeInvalidName = `field${new Date().getTime()}Invalid`;

  const query: Parameters<(typeof adminClient)['getEntities']>[0] = {
    entityTypes: ['MigrationEntity'],
    text: 'Kaboom',
  };

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add the fields
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      entityTypes: [
        {
          name: 'MigrationEntity',
          fields: [
            { name: fieldToDeleteName, type: FieldType.String },
            { name: fieldToBecomeInvalidName, type: FieldType.String },
          ],
        },
      ],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the new fields set
    const { entity } = (
      await adminClient.createEntity(
        copyEntity(MIGRATIONS_ENTITY_CREATE, {
          fields: { [fieldToDeleteName]: query.text, [fieldToBecomeInvalidName]: 'invalid' },
        }),
      )
    ).valueOrThrow();

    // Check that it's in the index
    const countBeforeSchemaUpdate = (
      await countSearchResultWithEntity(adminClient, query, entity.id)
    ).valueOrThrow();
    assertEquals(countBeforeSchemaUpdate, 1);

    // Delete the field and change the other field to be invalid
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      entityTypes: [
        {
          name: 'MigrationEntity',
          fields: [
            {
              name: fieldToBecomeInvalidName,
              type: FieldType.String,
              values: [{ value: 'valid' }],
            },
          ],
        },
      ],
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [
            { action: 'deleteField', entityType: 'MigrationEntity', field: fieldToDeleteName },
          ],
        },
      ],
    });
    assertOkResult(secondUpdateResult);

    // Process the entity
    assertResultValue(await adminClient.processDirtyEntity({ id: entity.id }), {
      id: entity.id,
      valid: false,
      validPublished: null,
      previousValid: true,
      previousValidPublished: null,
    });

    return ok(entity);
  });
  assertOkResult(result);

  // Check that it's no longer in the index
  const countAfterSchemaUpdate = (
    await countSearchResultWithEntity(adminClient, query, result.value.id)
  ).valueOrThrow();
  assertEquals(countAfterSchemaUpdate, 0);
}

async function updateSchemaSpecification_deleteFieldOnComponent({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const fieldName = `field${new Date().getTime()}`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new field
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      componentTypes: [
        { name: 'MigrationComponent', fields: [{ name: fieldName, type: FieldType.String }] },
      ],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the new field set
    const { entity } = (
      await adminClient.createEntity(
        copyEntity(VALUE_ITEMS_CREATE, {
          fields: { any: { type: 'MigrationComponent', [fieldName]: 'value' } },
        }),
        { publish: true },
      )
    ).valueOrThrow();

    // Delete the field
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [
            { action: 'deleteField', componentType: 'MigrationComponent', field: fieldName },
          ],
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
  assertIsAdminComponents(entityAfterMigration);
  const adminComponent = entityAfterMigration.fields.any as Component;
  assertEquals(adminComponent.type, 'MigrationComponent');
  assertEquals(fieldName in adminComponent, false);

  // And in published entity
  const publishedEntityAfterMigration = (
    await publishedClient.getEntity({ id: result.value.id })
  ).valueOrThrow();
  assertIsPublishedComponents(publishedEntityAfterMigration);
  const publishedComponent = publishedEntityAfterMigration.fields.any as Component;
  assertEquals(publishedComponent.type, 'MigrationComponent');
  assertEquals(fieldName in publishedComponent, false);

  // Ensure it's not possible to use the field
  const updateResult = await adminClient.updateEntity(
    {
      id: result.value.id,
      fields: { any: { type: 'MigrationComponent', [fieldName]: 'new value' } },
    },
    { publish: true },
  );
  assertErrorResult(
    updateResult,
    ErrorType.BadRequest,
    `entity.fields.any: Invalid fields for component of type MigrationComponent: ${fieldName}`,
  );
}

async function updateSchemaSpecification_deleteFieldOnComponentIndexesUpdated({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const fieldName = `field${new Date().getTime()}`;

  const query: Parameters<(typeof adminClient)['getEntities']>[0] = {
    entityTypes: ['Components'],
    text: 'Copyrightable',
  };

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new field
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      componentTypes: [
        { name: 'MigrationComponent', fields: [{ name: fieldName, type: FieldType.String }] },
      ],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the new field set
    const { entity } = (
      await adminClient.createEntity(
        copyEntity(VALUE_ITEMS_CREATE, {
          fields: { any: { type: 'MigrationComponent', [fieldName]: query.text } },
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
          actions: [
            { action: 'deleteField', componentType: 'MigrationComponent', field: fieldName },
          ],
        },
      ],
    });
    assertOkResult(secondUpdateResult);

    // Process the entity
    assertResultValue(await adminClient.processDirtyEntity({ id: entity.id }), {
      id: entity.id,
      valid: true,
      validPublished: null,
      previousValid: true,
      previousValidPublished: null,
    });

    return ok(entity);
  });
  assertOkResult(result);

  // Check that it's no longer in the index
  const countAfterSchemaUpdate = (
    await countSearchResultWithEntity(adminClient, query, result.value.id)
  ).valueOrThrow();
  assertEquals(countAfterSchemaUpdate, 0);
}

async function updateSchemaSpecification_renameFieldOnEntity({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
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
    `entity.fields: MigrationEntity does not include the fields: ${oldFieldName}`,
  );
}

async function updateSchemaSpecification_renameFieldOnEntityAndReplaceWithAnotherField({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
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

async function updateSchemaSpecification_renameFieldOnComponent({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const oldFieldName = `field${new Date().getTime()}`;
  const newFieldName = `${oldFieldName}New`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new field
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      componentTypes: [
        { name: 'MigrationComponent', fields: [{ name: oldFieldName, type: FieldType.String }] },
      ],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the new field set
    const { entity } = (
      await adminClient.createEntity(
        copyEntity(VALUE_ITEMS_CREATE, {
          fields: { any: { type: 'MigrationComponent', [oldFieldName]: 'value' } },
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
              componentType: 'MigrationComponent',
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
  const componentAfterMigration = entityAfterMigration.fields.any as Component;
  assertEquals(oldFieldName in componentAfterMigration, false);
  assertEquals(componentAfterMigration[newFieldName], 'value');

  // And in published entity
  const publishedEntityAfterMigration = (
    await publishedClient.getEntity({ id: entityId })
  ).valueOrThrow() as AdminEntity;
  const publishedComponent = publishedEntityAfterMigration.fields.any as Component;
  assertEquals(oldFieldName in publishedComponent, false);
  assertEquals(publishedComponent[newFieldName], 'value');

  // Check that the new name is usable
  const updatedNewNameEntity = (
    await adminClient.updateEntity(
      {
        id: entityId,
        fields: { any: { type: 'MigrationComponent', [newFieldName]: 'updated value' } },
      },
      { publish: true },
    )
  ).valueOrThrow().entity as AdminEntity;
  assertEquals((updatedNewNameEntity.fields.any as Component)[newFieldName], 'updated value');

  // Check that the old name is not usable
  const updatedOldNameResult = await adminClient.updateEntity(
    {
      id: entityId,
      fields: { any: { type: 'MigrationComponent', [oldFieldName]: 'updated value' } },
    },
    { publish: true },
  );
  assertErrorResult(
    updatedOldNameResult,
    ErrorType.BadRequest,
    `entity.fields.any: Invalid fields for component of type MigrationComponent: ${oldFieldName}`,
  );
}

async function updateSchemaSpecification_deleteTypeOnEntityType({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const typeName = `MigrationEntity${new Date().getTime()}`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new type
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      entityTypes: [{ name: typeName, fields: [{ name: 'field', type: FieldType.String }] }],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Delete the type
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [{ action: 'deleteType', entityType: typeName }],
        },
      ],
    });
    return ok(secondUpdateResult.valueOrThrow().schemaSpecification);
  });
  const schemaSpec = result.valueOrThrow();

  const entityType = schemaSpec.entityTypes.find((et) => et.name === typeName);
  assertEquals(entityType, undefined);
}

async function updateSchemaSpecification_deleteTypeOnTwoEntityTypes({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const typeName1 = `MigrationEntity${new Date().getTime()}`;
  const typeName2 = `${typeName1}2`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new types
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      entityTypes: [
        { name: typeName1, fields: [{ name: 'field', type: FieldType.String }] },
        { name: typeName2, fields: [{ name: 'field', type: FieldType.String }] },
      ],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Delete the types
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [
            { action: 'deleteType', entityType: typeName1 },
            { action: 'deleteType', entityType: typeName2 },
          ],
        },
      ],
    });
    return ok(secondUpdateResult.valueOrThrow().schemaSpecification);
  });
  const schemaSpec = result.valueOrThrow();

  const entityType = schemaSpec.entityTypes.find(
    (et) => et.name === typeName1 || et.name === typeName2,
  );
  assertEquals(entityType, undefined);
}

async function updateSchemaSpecification_deleteTypeOnComponent({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const typeName = `MigrationComponent${new Date().getTime()}`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new component type
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      componentTypes: [{ name: typeName, fields: [{ name: 'field', type: FieldType.String }] }],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the new component type
    const { entity } = (
      await adminClient.createEntity(
        copyEntity(VALUE_ITEMS_CREATE, {
          fields: { any: { type: typeName, field: `Hello ${typeName}` } as AppAdminComponent },
        }),
        { publish: true },
      )
    ).valueOrThrow();

    // Delete the type
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [{ action: 'deleteType', componentType: typeName }],
        },
      ],
    });
    assertOkResult(secondUpdateResult);
    return ok({ id: entity.id });
  });
  const reference = result.valueOrThrow();

  // Check that the component is removed
  const adminEntity = (await adminClient.getEntity(reference)).valueOrThrow();
  assertIsAdminComponents(adminEntity);
  assertEquals(adminEntity.fields.any, null);

  // And in published entity
  const publishedEntity = (await publishedClient.getEntity(reference)).valueOrThrow();
  assertIsPublishedComponents(publishedEntity);
  assertEquals(publishedEntity.fields.any, null);

  // Check that we can't create new components with the name
  const updateResult = await adminClient.updateEntity({
    id: reference.id,
    fields: { any: { type: typeName, field: 'updated value' } },
  });
  assertErrorResult(
    updateResult,
    ErrorType.BadRequest,
    `entity.fields.any: Couldn’t find spec for component type ${typeName}`,
  );
}

async function updateSchemaSpecification_deleteTypeOnComponentAndReplaceWithAnotherType({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const typeName = `MigrationComponent${new Date().getTime()}`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add type
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      componentTypes: [{ name: typeName, fields: [{ name: 'field', type: FieldType.String }] }],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the component type
    const { entity } = (
      await adminClient.createEntity(
        copyEntity(VALUE_ITEMS_CREATE, {
          fields: {
            any: { type: typeName, field: `Hello ${typeName}` } as AppAdminComponent,
          },
        }),
        { publish: true },
      )
    ).valueOrThrow();

    // Delete/replace the component type
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      componentTypes: [
        { name: typeName, fields: [{ name: 'field', type: FieldType.Location, list: true }] },
      ],
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [{ action: 'deleteType', componentType: typeName }],
        },
      ],
    });
    assertOkResult(secondUpdateResult);
    return ok({ id: entity.id });
  });
  const reference = result.valueOrThrow();

  // Check that component type is deleted
  const adminEntity = (await adminClient.getEntity(reference)).valueOrThrow();
  assertIsAdminComponents(adminEntity);
  assertEquals(adminEntity.fields.any, null);

  // And for published entity
  const publishedEntity = (await publishedClient.getEntity(reference)).valueOrThrow();
  assertIsPublishedComponents(publishedEntity);
  assertEquals(publishedEntity.fields.any, null);

  // Check that the new type is usable
  const updatedEntity = (
    await adminClient.updateEntity<AdminComponents>(
      {
        id: reference.id,
        fields: { any: { type: typeName, field: [{ lat: 1, lng: 2 }] } as AppAdminComponent },
      },
      { publish: true },
    )
  ).valueOrThrow().entity;
  assertEquals(updatedEntity.fields.any, {
    type: typeName,
    field: [{ lat: 1, lng: 2 }],
  } as AppAdminComponent);
}

async function updateSchemaSpecification_deleteTypeOnComponentInvalidBecomesValid({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const typeName = `MigrationComponent${new Date().getTime()}`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new type
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      componentTypes: [{ name: typeName, fields: [{ name: 'field', type: FieldType.String }] }],
    });
    assertOkResult(firstUpdateResult);

    // Create entity with the new type
    const { entity } = (
      await adminClient.createEntity(
        copyEntity(VALUE_ITEMS_CREATE, {
          fields: {
            any: { type: typeName, field: 'this value will become invalid' } as AppAdminComponent,
          },
        }),
        { publish: true },
      )
    ).valueOrThrow();
    const reference = { id: entity.id };

    // Change validations to make the field invalid
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      componentTypes: [
        {
          name: typeName,
          fields: [{ name: 'field', type: FieldType.String, values: [{ value: 'valid' }] }],
        },
      ],
    });
    const { schemaSpecification } = secondUpdateResult.valueOrThrow();

    // Process the entity
    assertResultValue(await adminClient.processDirtyEntity(reference), {
      id: reference.id,
      valid: false,
      validPublished: false,
      previousValid: true,
      previousValidPublished: true,
    });

    // Delete the component type
    const thirdUpdateResult = await adminClient.updateSchemaSpecification({
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [{ action: 'deleteType', componentType: typeName }],
        },
      ],
    });
    assertOkResult(thirdUpdateResult);

    // Process the entity
    assertResultValue(await adminClient.processDirtyEntity({ id: entity.id }), {
      id: reference.id,
      valid: true,
      validPublished: true,
      previousValid: false,
      previousValidPublished: false,
    });

    return ok(undefined);
  });
  assertOkResult(result);
}

async function updateSchemaSpecification_deleteTypeOnComponentIndexesUpdated({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const typeName = `MigrationComponent${new Date().getTime()}`;

  const query: Parameters<(typeof adminClient)['getEntities']>[0] = {
    entityTypes: ['Components'],
    text: 'wingspan hero',
  };

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new type
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      componentTypes: [{ name: typeName, fields: [{ name: 'field', type: FieldType.String }] }],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the new type
    const { entity } = (
      await adminClient.createEntity(
        copyEntity(VALUE_ITEMS_CREATE, {
          fields: { any: { type: typeName, field: query.text } as AppAdminComponent },
        }),
      )
    ).valueOrThrow();

    // Check that it's in the index
    const countBeforeSchemaUpdate = (
      await countSearchResultWithEntity(adminClient, query, entity.id)
    ).valueOrThrow();
    assertEquals(countBeforeSchemaUpdate, 1);

    // Delete the type
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [{ action: 'deleteType', componentType: typeName }],
        },
      ],
    });
    assertOkResult(secondUpdateResult);

    // Process the entity
    assertResultValue(await adminClient.processDirtyEntity({ id: entity.id }), {
      id: entity.id,
      valid: true,
      validPublished: null,
      previousValid: true,
      previousValidPublished: null,
    });

    return ok({ id: entity.id });
  });
  const reference = result.valueOrThrow();

  // Check that it's no longer in the index
  const countAfterSchemaUpdate = (
    await countSearchResultWithEntity(adminClient, query, reference.id)
  ).valueOrThrow();
  assertEquals(countAfterSchemaUpdate, 0);
}

async function updateSchemaSpecification_renameTypeOnEntity({ clientProvider }: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const oldTypeName = `MigrationEntity${new Date().getTime()}`;
  const newTypeName = `${oldTypeName}New`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new type
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      entityTypes: [{ name: oldTypeName, fields: [{ name: 'field', type: FieldType.String }] }],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the new type
    const { entity } = (
      await adminClient.createEntity(
        {
          info: {
            type: oldTypeName as AppAdminEntity['info']['type'],
            name: oldTypeName,
          },
          fields: { field: 'value' },
        },
        { publish: true },
      )
    ).valueOrThrow();

    // Rename the type
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [{ action: 'renameType', entityType: oldTypeName, newName: newTypeName }],
        },
      ],
    });
    assertOkResult(secondUpdateResult);
    return ok({ id: entity.id });
  });
  const reference = result.valueOrThrow();

  // Check that the entity has the new type
  const adminEntity = (await adminClient.getEntity(reference)).valueOrThrow();
  assertEquals(adminEntity.info.type, newTypeName);

  // And in published entity
  const publishedEntity = (await publishedClient.getEntity(reference)).valueOrThrow();
  assertEquals(publishedEntity.info.type, newTypeName);

  // Check that we can update the entity
  const {
    entity: {
      info: { updatedAt },
    },
  } = (
    await adminClient.updateEntity({ ...reference, fields: { field: 'value2' } })
  ).valueOrThrow();

  // Check that we can create new entities with the name
  assertOkResult(
    await adminClient.createEntity(
      {
        info: {
          type: newTypeName as AppAdminEntity['info']['type'],
          name: `${newTypeName}`,
        },
        fields: { field: 'value' },
      },
      { publish: true },
    ),
  );

  // Check the changelog events for the first entity
  const connectionResult = await adminClient.getChangelogEvents({ entity: reference });
  assertChangelogEventsConnection(connectionResult, [
    {
      type: EventType.createAndPublishEntity,
      createdAt: adminEntity.info.createdAt,
      createdBy: '',
      // The event before the type rename has the old type name
      entities: [{ id: reference.id, type: oldTypeName, name: adminEntity.info.name, version: 1 }],
      unauthorizedEntityCount: 0,
    },
    {
      type: EventType.updateEntity,
      createdAt: updatedAt,
      createdBy: '',
      // The event after the type rename has the new type name
      entities: [{ id: reference.id, type: newTypeName, name: adminEntity.info.name, version: 2 }],
      unauthorizedEntityCount: 0,
    },
  ]);
}

async function updateSchemaSpecification_renameTypeOnEntityAndReplaceWithAnotherType({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const oldTypeName = `MigrationEntity${new Date().getTime()}`;
  const newTypeName = `${oldTypeName}New`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add type
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      entityTypes: [{ name: oldTypeName, fields: [{ name: 'field', type: FieldType.String }] }],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the type
    const { entity } = (
      await adminClient.createEntity(
        {
          info: {
            type: oldTypeName as AppAdminEntity['info']['type'],
            name: oldTypeName,
          },
          fields: { field: 'value' },
        },
        { publish: true },
      )
    ).valueOrThrow();

    // Rename/replace the type
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      entityTypes: [
        { name: oldTypeName, fields: [{ name: 'field', type: FieldType.Location, list: true }] },
      ],
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [{ action: 'renameType', entityType: oldTypeName, newName: newTypeName }],
        },
      ],
    });
    assertOkResult(secondUpdateResult);
    return ok({ id: entity.id });
  });
  const reference = result.valueOrThrow();

  // Check that entity type is renamed
  const adminEntity = (await adminClient.getEntity(reference)).valueOrThrow();
  assertEquals(adminEntity.info.type, newTypeName);

  // And for published entity
  const publishedEntity = (await publishedClient.getEntity(reference)).valueOrThrow();
  assertEquals(publishedEntity.info.type, newTypeName);

  // Check that both types are usable
  assertOkResult(
    await adminClient.createEntity(
      {
        info: {
          type: newTypeName as AppAdminEntity['info']['type'],
          name: newTypeName,
        },
        fields: { field: 'value' },
      },
      { publish: true },
    ),
  );

  assertOkResult(
    await adminClient.createEntity(
      {
        info: {
          type: oldTypeName as AppAdminEntity['info']['type'],
          name: oldTypeName,
        },
        fields: { field: [{ lat: 1, lng: 2 }] },
      },
      { publish: true },
    ),
  );
}

async function updateSchemaSpecification_renameTypeOnComponent({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const oldTypeName = `MigrationComponent${new Date().getTime()}`;
  const newTypeName = `${oldTypeName}New`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new component type
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      componentTypes: [{ name: oldTypeName, fields: [{ name: 'field', type: FieldType.String }] }],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the new component type
    const { entity } = (
      await adminClient.createEntity(
        copyEntity(VALUE_ITEMS_CREATE, {
          fields: {
            any: { type: oldTypeName, field: `Hello ${oldTypeName}` } as AppAdminComponent,
          },
        }),
        { publish: true },
      )
    ).valueOrThrow();

    // Rename the type
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [{ action: 'renameType', componentType: oldTypeName, newName: newTypeName }],
        },
      ],
    });
    assertOkResult(secondUpdateResult);
    return ok({ id: entity.id });
  });
  const reference = result.valueOrThrow();

  // Check that the component has the new type
  const adminEntity = (await adminClient.getEntity(reference)).valueOrThrow();
  assertIsAdminComponents(adminEntity);
  assertEquals(adminEntity.fields.any, {
    type: newTypeName,
    field: `Hello ${oldTypeName}`,
  } as AppAdminComponent);

  // And in published entity
  const publishedEntity = (await publishedClient.getEntity(reference)).valueOrThrow();
  assertIsPublishedComponents(publishedEntity);
  assertEquals(publishedEntity.fields.any, {
    type: newTypeName,
    field: `Hello ${oldTypeName}`,
  } as AppPublishedComponent);

  // Check that we can create new components with the name
  const updateResult = await adminClient.updateEntity(
    {
      id: reference.id,
      fields: { any: { type: newTypeName, field: 'updated value' } },
    },
    { publish: true },
  );
  assertOkResult(updateResult);
}

async function updateSchemaSpecification_renameTypeOnComponentAndReplaceWithAnotherType({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const oldTypeName = `MigrationComponent${new Date().getTime()}`;
  const newTypeName = `${oldTypeName}New`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add type
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      componentTypes: [{ name: oldTypeName, fields: [{ name: 'field', type: FieldType.String }] }],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the component type
    const { entity } = (
      await adminClient.createEntity(
        copyEntity(VALUE_ITEMS_CREATE, {
          fields: {
            any: { type: oldTypeName, field: `Hello ${oldTypeName}` } as AppAdminComponent,
          },
        }),
        { publish: true },
      )
    ).valueOrThrow();

    // Rename/replace the component type
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      componentTypes: [
        { name: oldTypeName, fields: [{ name: 'field', type: FieldType.Location, list: true }] },
      ],
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [{ action: 'renameType', componentType: oldTypeName, newName: newTypeName }],
        },
      ],
    });
    assertOkResult(secondUpdateResult);
    return ok({ id: entity.id });
  });
  const reference = result.valueOrThrow();

  // Check that component type is renamed
  const adminEntity = (await adminClient.getEntity(reference)).valueOrThrow();
  assertIsAdminComponents(adminEntity);
  assertEquals(adminEntity.fields.any, {
    type: newTypeName,
    field: `Hello ${oldTypeName}`,
  } as AppAdminComponent);

  // And for published entity
  const publishedEntity = (await publishedClient.getEntity(reference)).valueOrThrow();
  assertIsPublishedComponents(publishedEntity);
  assertEquals(publishedEntity.fields.any, {
    type: newTypeName,
    field: `Hello ${oldTypeName}`,
  } as AppPublishedComponent);

  // Check that both types are usable
  const updatedEntity = (
    await adminClient.updateEntity<AdminComponents>(
      {
        id: reference.id,
        fields: {
          any: { type: oldTypeName, field: [{ lat: 1, lng: 2 }] } as AppAdminComponent,
          anyAdminOnly: { type: newTypeName, field: `Hello ${newTypeName}` } as AppAdminComponent,
        },
      },
      { publish: true },
    )
  ).valueOrThrow().entity;
  assertEquals(updatedEntity.fields.any, {
    type: oldTypeName,
    field: [{ lat: 1, lng: 2 }],
  } as AppAdminComponent);
  assertEquals(updatedEntity.fields.anyAdminOnly, {
    type: newTypeName,
    field: `Hello ${newTypeName}`,
  } as AppAdminComponent);
}

async function updateSchemaSpecification_renameTypeOnComponentUpdatesComponentTypeIndexes({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const oldTypeName = `MigrationComponent${new Date().getTime()}`;
  const newTypeName = `${oldTypeName}New`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new component type
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      componentTypes: [{ name: oldTypeName, fields: [{ name: 'field', type: FieldType.String }] }],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the new component type
    const { entity } = (
      await adminClient.createEntity(
        copyEntity(VALUE_ITEMS_CREATE, {
          fields: {
            any: { type: oldTypeName, field: `Hello ${oldTypeName}` } as AppAdminComponent,
          },
        }),
        { publish: true },
      )
    ).valueOrThrow();

    // Check that it's in the index
    const adminCountBeforeUpdateResult = await countSearchResultWithEntity(
      adminClient,
      { entityTypes: ['Components'], componentTypes: [oldTypeName as AppAdminComponent['type']] },
      entity.id,
    );
    assertResultValue(adminCountBeforeUpdateResult, 1);

    const publishedCountBeforeUpdateResult = await countSearchResultWithEntity(
      publishedClient,
      {
        entityTypes: ['Components'],
        componentTypes: [oldTypeName as AppPublishedComponent['type']],
      },
      entity.id,
    );
    assertResultValue(publishedCountBeforeUpdateResult, 1);

    // Rename the type
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [{ action: 'renameType', componentType: oldTypeName, newName: newTypeName }],
        },
      ],
    });
    assertOkResult(secondUpdateResult);
    return ok({ id: entity.id });
  });
  const reference = result.valueOrThrow();

  // No processing to check that the component types index is updated as part of the schema update

  // Check that it's in the index
  const adminCountAfterUpdateResult = await countSearchResultWithEntity(
    adminClient,
    { entityTypes: ['Components'], componentTypes: [newTypeName as AppAdminComponent['type']] },
    reference.id,
  );
  assertResultValue(adminCountAfterUpdateResult, 1);

  const publishedCountAfterUpdateResult = await countSearchResultWithEntity(
    publishedClient,
    { entityTypes: ['Components'], componentTypes: [newTypeName as AppPublishedComponent['type']] },
    reference.id,
  );
  assertResultValue(publishedCountAfterUpdateResult, 1);
}

async function updateSchemaSpecification_renameFieldAndRenameTypeOnEntity({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const oldTypeName = `MigrationEntity${new Date().getTime()}`;
  const newTypeName = `${oldTypeName}New`;
  const oldFieldName = 'oldField';
  const newFieldName = 'newField';

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new type
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      entityTypes: [
        { name: oldTypeName, fields: [{ name: oldFieldName, type: FieldType.String }] },
      ],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the new type
    const { entity } = (
      await adminClient.createEntity(
        {
          info: {
            type: oldTypeName as AppAdminEntity['info']['type'],
            name: oldTypeName,
          },
          fields: { [oldFieldName]: 'value' },
        },
        { publish: true },
      )
    ).valueOrThrow();

    // Rename the field and the type
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [
            {
              action: 'renameField',
              entityType: oldTypeName,
              field: oldFieldName,
              newName: newFieldName,
            },
            { action: 'renameType', entityType: oldTypeName, newName: newTypeName },
          ],
        },
      ],
    });
    assertOkResult(secondUpdateResult);
    return ok({ id: entity.id });
  });
  const reference = result.valueOrThrow();

  // Check that the entity has the new type and field
  const adminEntity = (await adminClient.getEntity(reference)).valueOrThrow() as AdminEntity;
  assertEquals(adminEntity.info.type, newTypeName);
  assertEquals(adminEntity.fields[newFieldName], 'value');
  assertEquals(oldFieldName in adminEntity.fields, false);

  // And in published entity
  const publishedEntity = (
    await publishedClient.getEntity(reference)
  ).valueOrThrow() as PublishedEntity;
  assertEquals(publishedEntity.info.type, newTypeName);
  assertEquals(publishedEntity.fields[newFieldName], 'value');
  assertEquals(oldFieldName in publishedEntity.fields, false);
}

async function updateSchemaSpecification_renameTypeAndRenameFieldOnEntity({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const oldTypeName = `MigrationEntity${new Date().getTime()}`;
  const newTypeName = `${oldTypeName}New`;
  const oldFieldName = 'oldField';
  const newFieldName = 'newField';

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new type
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      entityTypes: [
        { name: oldTypeName, fields: [{ name: oldFieldName, type: FieldType.String }] },
      ],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the new type
    const { entity } = (
      await adminClient.createEntity(
        {
          info: {
            type: oldTypeName as AppAdminEntity['info']['type'],
            name: oldTypeName,
          },
          fields: { [oldFieldName]: 'value' },
        },
        { publish: true },
      )
    ).valueOrThrow();

    // Rename the field and the type
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [
            { action: 'renameType', entityType: oldTypeName, newName: newTypeName },
            {
              action: 'renameField',
              entityType: newTypeName,
              field: oldFieldName,
              newName: newFieldName,
            },
          ],
        },
      ],
    });
    assertOkResult(secondUpdateResult);
    return ok({ id: entity.id });
  });
  const reference = result.valueOrThrow();

  // Check that the entity has the new type and field
  const adminEntity = (await adminClient.getEntity(reference)).valueOrThrow() as AdminEntity;
  assertEquals(adminEntity.info.type, newTypeName);
  assertEquals(adminEntity.fields[newFieldName], 'value');
  assertEquals(oldFieldName in adminEntity.fields, false);

  // And in published entity
  const publishedEntity = (
    await publishedClient.getEntity(reference)
  ).valueOrThrow() as PublishedEntity;
  assertEquals(publishedEntity.info.type, newTypeName);
  assertEquals(publishedEntity.fields[newFieldName], 'value');
  assertEquals(oldFieldName in publishedEntity.fields, false);
}

async function updateSchemaSpecification_renameFieldAndRenameTypeOnComponent({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const oldTypeName = `MigrationComponent${new Date().getTime()}`;
  const newTypeName = `${oldTypeName}New`;
  const oldFieldName = 'oldField';
  const newFieldName = 'newField';

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new component type
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      componentTypes: [
        { name: oldTypeName, fields: [{ name: oldFieldName, type: FieldType.String }] },
      ],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the new component type
    const { entity } = (
      await adminClient.createEntity(
        copyEntity(VALUE_ITEMS_CREATE, {
          fields: { any: { type: oldTypeName, [oldFieldName]: 'value' } as AppAdminComponent },
        }),
        { publish: true },
      )
    ).valueOrThrow();

    // Rename the field and type
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [
            {
              action: 'renameField',
              componentType: oldTypeName,
              field: oldFieldName,
              newName: newFieldName,
            },
            { action: 'renameType', componentType: oldTypeName, newName: newTypeName },
          ],
        },
      ],
    });
    assertOkResult(secondUpdateResult);
    return ok({ id: entity.id });
  });
  const reference = result.valueOrThrow();

  // Check that the component has the new type
  const adminEntity = (await adminClient.getEntity(reference)).valueOrThrow();
  assertIsAdminComponents(adminEntity);
  assertEquals(adminEntity.fields.any, {
    type: newTypeName,
    [newFieldName]: 'value',
  } as AppAdminComponent);

  // And in published entity
  const publishedEntity = (await publishedClient.getEntity(reference)).valueOrThrow();
  assertIsPublishedComponents(publishedEntity);
  assertEquals(publishedEntity.fields.any, {
    type: newTypeName,
    [newFieldName]: 'value',
  } as AppPublishedComponent);

  // Check that we can create new components with the name
  const updateResult = await adminClient.updateEntity(
    {
      id: reference.id,
      fields: { any: { type: newTypeName, [newFieldName]: 'updated value' } },
    },
    { publish: true },
  );
  assertOkResult(updateResult);
}

async function updateSchemaSpecification_renameTypeAndRenameFieldOnComponent({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const oldTypeName = `MigrationComponent${new Date().getTime()}`;
  const newTypeName = `${oldTypeName}New`;
  const oldFieldName = 'oldField';
  const newFieldName = 'newField';

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new component type
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      componentTypes: [
        { name: oldTypeName, fields: [{ name: oldFieldName, type: FieldType.String }] },
      ],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create entity with the new component type
    const { entity } = (
      await adminClient.createEntity(
        copyEntity(VALUE_ITEMS_CREATE, {
          fields: { any: { type: oldTypeName, [oldFieldName]: 'value' } as AppAdminComponent },
        }),
        { publish: true },
      )
    ).valueOrThrow();

    // Rename the field and type
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [
            { action: 'renameType', componentType: oldTypeName, newName: newTypeName },
            {
              action: 'renameField',
              componentType: newTypeName,
              field: oldFieldName,
              newName: newFieldName,
            },
          ],
        },
      ],
    });
    assertOkResult(secondUpdateResult);
    return ok({ id: entity.id });
  });
  const reference = result.valueOrThrow();

  // Check that the component has the new type
  const adminEntity = (await adminClient.getEntity(reference)).valueOrThrow();
  assertIsAdminComponents(adminEntity);
  assertEquals(adminEntity.fields.any, {
    type: newTypeName,
    [newFieldName]: 'value',
  } as AppAdminComponent);

  // And in published entity
  const publishedEntity = (await publishedClient.getEntity(reference)).valueOrThrow();
  assertIsPublishedComponents(publishedEntity);
  assertEquals(publishedEntity.fields.any, {
    type: newTypeName,
    [newFieldName]: 'value',
  } as AppPublishedComponent);

  // Check that we can create new components with the name
  const updateResult = await adminClient.updateEntity(
    {
      id: reference.id,
      fields: { any: { type: newTypeName, [newFieldName]: 'updated value' } },
    },
    { publish: true },
  );
  assertOkResult(updateResult);
}

async function updateSchemaSpecification_addingIndexToField({ clientProvider }: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const fieldName = `field${new Date().getTime()}`;
  const indexName = fieldName;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new field
    assertOkResult(
      await adminClient.updateSchemaSpecification({
        entityTypes: [
          {
            name: 'MigrationEntity',
            fields: [{ name: fieldName, type: FieldType.String, list: true }],
          },
        ],
      }),
    );

    // Create two entities with both unique and shared values=
    const { entity: entityA } = (
      await adminClient.createEntity(
        copyEntity(MIGRATIONS_ENTITY_CREATE, { fields: { [fieldName]: ['shared', 'uniqueA'] } }),
      )
    ).valueOrThrow();

    const { entity: entityB } = (
      await adminClient.createEntity(
        copyEntity(MIGRATIONS_ENTITY_CREATE, { fields: { [fieldName]: ['shared', 'uniqueB'] } }),
      )
    ).valueOrThrow();

    // Add unique index to the field
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      entityTypes: [
        {
          name: 'MigrationEntity',
          fields: [{ name: fieldName, type: FieldType.String, index: indexName }],
        },
      ],
      indexes: [{ name: indexName, type: 'unique' }],
    });
    assertOkResult(secondUpdateResult);

    // Process the entities
    assertOkResult(await adminClient.processDirtyEntity({ id: entityA.id }));
    assertOkResult(await adminClient.processDirtyEntity({ id: entityB.id }));

    // Check that the unique values work
    const uniqueA = (
      await adminClient.getEntity({ index: indexName as AppAdminUniqueIndexes, value: 'uniqueA' })
    ).valueOrThrow();
    assertEquals(uniqueA.id, entityA.id);

    const uniqueB = (
      await adminClient.getEntity({ index: indexName as AppAdminUniqueIndexes, value: 'uniqueB' })
    ).valueOrThrow();
    assertEquals(uniqueB.id, entityB.id);

    // Check that the shared value only resolves to one entity
    const shared = (
      await adminClient.getEntity({ index: indexName as AppAdminUniqueIndexes, value: 'shared' })
    ).valueOrThrow();
    if (shared.id === entityA.id) {
      assertSame(uniqueA.info.valid, true);
      assertSame(uniqueB.info.valid, false);
    } else if (shared.id === entityB.id) {
      assertSame(uniqueA.info.valid, false);
      assertSame(uniqueB.info.valid, true);
    } else {
      throw new Error('shared value did not resolve to either entity');
    }

    return ok(undefined);
  });
  assertOkResult(result);
}

async function updateSchemaSpecification_deleteIndexClearsIndexDirectly({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const fieldName = `field${new Date().getTime()}`;
  const indexName = fieldName as AppAdminUniqueIndexes;
  const uniqueValue = 'unique value';

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new field
    const { schemaSpecification } = (
      await adminClient.updateSchemaSpecification({
        entityTypes: [
          {
            name: 'MigrationEntity',
            fields: [{ name: fieldName, type: FieldType.String, index: indexName }],
          },
        ],
        indexes: [{ name: indexName, type: 'unique' }],
      })
    ).valueOrThrow();

    // Create entity with unique value
    assertOkResult(
      await adminClient.createEntity(
        copyEntity(MIGRATIONS_ENTITY_CREATE, { fields: { [fieldName]: uniqueValue } }),
      ),
    );

    // Delete unique index and add another index with the same name
    assertOkResult(
      await adminClient.updateSchemaSpecification({
        version: schemaSpecification.version + 1,
        transientMigrations: [{ action: 'deleteIndex', index: indexName }],
      }),
    );

    // Don't process the entity, the unique index should be updated directly

    return ok(undefined);
  });
  assertOkResult(result);

  // Check that we can't fetch the old entity with the unique index
  const firstGetResult = await adminClient.getEntity({ index: indexName, value: uniqueValue });
  assertErrorResult(firstGetResult, ErrorType.NotFound, 'No such entity');
}

async function updateSchemaSpecification_deleteIndexMultiple({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const fieldName1 = `field${new Date().getTime()}`;
  const fieldName2 = `${fieldName1}2`;
  const indexName1 = fieldName1 as AppAdminUniqueIndexes;
  const indexName2 = fieldName2 as AppAdminUniqueIndexes;
  const uniqueValue = 'unique value';

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new field
    const { schemaSpecification } = (
      await adminClient.updateSchemaSpecification({
        entityTypes: [
          {
            name: 'MigrationEntity',
            fields: [
              { name: fieldName1, type: FieldType.String, index: indexName1 },
              { name: fieldName2, type: FieldType.String, index: indexName2 },
            ],
          },
        ],
        indexes: [
          { name: indexName1, type: 'unique' },
          { name: indexName2, type: 'unique' },
        ],
      })
    ).valueOrThrow();

    // Create entity with unique value
    assertOkResult(
      await adminClient.createEntity(
        copyEntity(MIGRATIONS_ENTITY_CREATE, {
          fields: { [fieldName1]: uniqueValue, [fieldName2]: uniqueValue },
        }),
      ),
    );

    // Delete both unique indexes
    assertOkResult(
      await adminClient.updateSchemaSpecification({
        version: schemaSpecification.version + 1,
        transientMigrations: [
          { action: 'deleteIndex', index: indexName1 },
          { action: 'deleteIndex', index: indexName2 },
        ],
      }),
    );

    // Don't process the entity, the unique index should be updated directly

    return ok(undefined);
  });
  assertOkResult(result);

  // Check that we can't fetch the old entity with the unique index
  const firstGetResult = await adminClient.getEntity({ index: indexName1, value: uniqueValue });
  assertErrorResult(firstGetResult, ErrorType.NotFound, 'No such entity');
  const secondGetResult = await adminClient.getEntity({ index: indexName2, value: uniqueValue });
  assertErrorResult(secondGetResult, ErrorType.NotFound, 'No such entity');
}

async function updateSchemaSpecification_renameIndexMaintainsLinkDirectly({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const fieldName = `field${new Date().getTime()}`;
  const oldIndexName = fieldName as AppAdminUniqueIndexes;
  const newIndexName = `${fieldName}New` as AppAdminUniqueIndexes;
  const uniqueValue = 'unique value';

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new field
    const { schemaSpecification } = (
      await adminClient.updateSchemaSpecification({
        entityTypes: [
          {
            name: 'MigrationEntity',
            fields: [{ name: fieldName, type: FieldType.String, index: oldIndexName }],
          },
        ],
        indexes: [{ name: oldIndexName, type: 'unique' }],
      })
    ).valueOrThrow();

    // Create entity with unique value
    const { entity } = (
      await adminClient.createEntity(
        copyEntity(MIGRATIONS_ENTITY_CREATE, { fields: { [fieldName]: uniqueValue } }),
      )
    ).valueOrThrow();

    // Rename unique index
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      version: schemaSpecification.version + 1,
      transientMigrations: [{ action: 'renameIndex', index: oldIndexName, newName: newIndexName }],
    });
    assertOkResult(secondUpdateResult);

    // Don't process the entity, the unique index should be updated directly

    return ok({ id: entity.id });
  });
  const reference = result.valueOrThrow();

  // Check that the unique index works
  const entity = (
    await adminClient.getEntity({ index: newIndexName, value: uniqueValue })
  ).valueOrThrow();

  assertEquals(entity.id, reference.id);
}

async function updateSchemaSpecification_errorWrongVersion({ clientProvider }: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const schemaSpec = (await adminClient.getSchemaSpecification()).valueOrThrow();
  const version = schemaSpec.version;
  const result = await adminClient.updateSchemaSpecification({ version });
  assertErrorResult(
    result,
    ErrorType.BadRequest,
    `Expected version ${version + 1}, got ${version}`,
  );
}

async function updateSchemaSpecification_errorDeleteTypeOnEntityTypeWithExistingEntities({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const typeName = `MigrationEntity${new Date().getTime()}`;

  // Lock since the version needs to be consecutive
  const result = await withSchemaAdvisoryLock(adminClient, async () => {
    // First add new type
    const firstUpdateResult = await adminClient.updateSchemaSpecification({
      entityTypes: [{ name: typeName, fields: [{ name: 'field', type: FieldType.String }] }],
    });
    const { schemaSpecification } = firstUpdateResult.valueOrThrow();

    // Create an entity with the type
    assertOkResult(
      await adminClient.createEntity({
        info: { type: typeName as AppAdminEntity['info']['type'], name: typeName },
        fields: { field: 'value' },
      }),
    );

    // Try to delete the type
    const secondUpdateResult = await adminClient.updateSchemaSpecification({
      migrations: [
        {
          version: schemaSpecification.version + 1,
          actions: [{ action: 'deleteType', entityType: typeName }],
        },
      ],
    });

    assertErrorResult(
      secondUpdateResult,
      ErrorType.BadRequest,
      `Cannot delete entity types with 1 existing entities: ${typeName}`,
    );
    return ok(undefined);
  });
  assertOkResult(result);
}

async function updateSchemaSpecification_errorReadonlySession({
  clientProvider,
}: SchemaTestContext) {
  const adminClient = clientProvider.adminClient('main', 'readonly');
  const result = await adminClient.updateSchemaSpecification({});
  assertErrorResult(
    result,
    ErrorType.BadRequest,
    'Readonly session used to update schema specification',
  );
}
