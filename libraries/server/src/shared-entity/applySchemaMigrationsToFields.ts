import {
  isComponentItemField,
  isRichTextComponentNode,
  ok,
  transformEntityFields,
  type Component,
  type ErrorType,
  type Result,
  type SchemaMigrationAction,
  type SchemaWithMigrations,
} from '@dossierhq/core';
import type { DatabaseEntityFieldsPayload } from '@dossierhq/database-adapter';
import { assertExhaustive } from '../utils/AssertUtils.js';

export function applySchemaMigrationsToFields(
  schema: SchemaWithMigrations,
  targetEntityType: string,
  entityFields: DatabaseEntityFieldsPayload,
): Result<Record<string, unknown>, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const actions = schema.collectMigrationActionsSinceVersion(entityFields.schemaVersion);

  if (actions.length === 0) {
    return ok(entityFields.fields);
  }

  const entityTypeActions: Exclude<SchemaMigrationAction, { componentType: string }>[] = [];
  const componentTypeActions: Exclude<SchemaMigrationAction, { entityType: string }>[] = [];
  for (const action of actions) {
    if ('entityType' in action) {
      entityTypeActions.push(action);
    } else {
      componentTypeActions.push(action);
    }
  }

  const startingEntityType = getStartingEntityType(targetEntityType, entityTypeActions);

  const migratedFieldValues = migrateEntityFields(
    startingEntityType,
    entityFields.fields,
    entityTypeActions,
  );

  const transformResult: Result<
    Record<string, unknown>,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  > = transformEntityFields(
    schema,
    [],
    { info: { type: targetEntityType }, fields: migratedFieldValues },
    {
      transformField: (_schema, _path, _fieldSpec, value) => {
        return ok(value);
      },
      transformFieldItem: (_schema, _path, fieldSpec, value) => {
        if (isComponentItemField(fieldSpec, value) && value) {
          return ok(migrateComponent(value, componentTypeActions));
        }
        return ok(value);
      },
      transformRichTextNode: (_schema, _path, _fieldSpec, node) => {
        if (isRichTextComponentNode(node)) {
          const component = migrateComponent(node.data, componentTypeActions);
          if (!component) return ok(null);
          return ok({ ...node, data: component });
        }
        return ok(node);
      },
    },
  );

  if (transformResult.isError()) return transformResult;
  return ok(transformResult.value);
}

function getStartingEntityType(
  targetEntityType: string,
  entityTypeActions: Exclude<SchemaMigrationAction, { componentType: string }>[],
) {
  let entityType = targetEntityType;
  for (let i = entityTypeActions.length - 1; i >= 0; i--) {
    const action = entityTypeActions[i];
    if (action.action === 'renameType' && action.newName === entityType) {
      entityType = action.entityType;
    }
  }
  return entityType;
}

function migrateEntityFields(
  startingEntityType: string,
  originalFields: Record<string, unknown>,
  entityTypeActions: Exclude<SchemaMigrationAction, { componentType: string }>[],
) {
  let changed = false;
  let entityType = startingEntityType;
  const migratedFields = { ...originalFields };
  for (const actionSpec of entityTypeActions) {
    const { action } = actionSpec;
    switch (action) {
      case 'deleteField':
        if (actionSpec.entityType === entityType) {
          delete migratedFields[actionSpec.field];
          changed = true;
        }
        break;
      case 'renameField':
        if (actionSpec.entityType === entityType) {
          if (actionSpec.field in migratedFields) {
            migratedFields[actionSpec.newName] = migratedFields[actionSpec.field];
            delete migratedFields[actionSpec.field];
            changed = true;
          }
        }
        break;
      case 'renameType':
        if (actionSpec.entityType === entityType) {
          entityType = actionSpec.newName;
        }
        break;
    }
  }
  return changed ? migratedFields : originalFields;
}

function migrateComponent(
  originalComponent: Component | null,
  componentTypeActions: Exclude<SchemaMigrationAction, { entityType: string }>[],
): Component | null {
  if (!originalComponent) return null;

  const component = { ...originalComponent };

  for (const actionSpec of componentTypeActions) {
    const { action } = actionSpec;
    switch (action) {
      case 'deleteField':
        if (actionSpec.componentType === component.type) {
          delete component[actionSpec.field];
        }
        break;
      case 'renameField':
        if (actionSpec.componentType === component.type) {
          if (actionSpec.field in component) {
            component[actionSpec.newName] = component[actionSpec.field];
            delete component[actionSpec.field];
          }
        }
        break;
      case 'deleteType':
        if (actionSpec.componentType === component.type) {
          return null;
        }
        break;
      case 'renameType':
        if (actionSpec.componentType === component.type) {
          component.type = actionSpec.newName;
        }
        break;
      default:
        assertExhaustive(action);
    }
  }
  return component;
}
