import {
  assertExhaustive,
  isRichTextValueItemNode,
  isValueItemItemField,
  ok,
  transformEntityFields,
  type AdminSchemaMigrationAction,
  type AdminSchemaWithMigrations,
  type ErrorType,
  type Result,
  type ValueItem,
} from '@dossierhq/core';
import type { DatabaseEntityFieldsPayload } from '@dossierhq/database-adapter';

export function applySchemaMigrationsToFields(
  adminSchema: AdminSchemaWithMigrations,
  targetEntityType: string,
  entityFields: DatabaseEntityFieldsPayload,
): Result<Record<string, unknown>, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const actions = adminSchema.collectMigrationActionsSinceVersion(entityFields.schemaVersion);

  if (actions.length === 0) {
    return ok(entityFields.fields);
  }

  const entityTypeActions: Exclude<AdminSchemaMigrationAction, { valueType: string }>[] = [];
  const valueTypeActions: Exclude<AdminSchemaMigrationAction, { entityType: string }>[] = [];
  for (const action of actions) {
    if ('entityType' in action) {
      entityTypeActions.push(action);
    } else {
      valueTypeActions.push(action);
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
    adminSchema,
    [],
    { info: { type: targetEntityType }, fields: migratedFieldValues },
    {
      transformField: (_schema, _path, _fieldSpec, value) => {
        return ok(value);
      },
      transformFieldItem: (_schema, _path, fieldSpec, value) => {
        if (isValueItemItemField(fieldSpec, value) && value) {
          return ok(migrateValueItem(value, valueTypeActions));
        }
        return ok(value);
      },
      transformRichTextNode: (_schema, _path, _fieldSpec, node) => {
        if (isRichTextValueItemNode(node)) {
          const valueItem = migrateValueItem(node.data, valueTypeActions);
          if (!valueItem) return ok(null);
          return ok({ ...node, data: valueItem });
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
  entityTypeActions: Exclude<AdminSchemaMigrationAction, { valueType: string }>[],
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
  entityTypeActions: Exclude<AdminSchemaMigrationAction, { valueType: string }>[],
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

function migrateValueItem(
  originalValueItem: ValueItem | null,
  valueTypeActions: Exclude<AdminSchemaMigrationAction, { entityType: string }>[],
): ValueItem | null {
  if (!originalValueItem) return null;

  const valueItem = { ...originalValueItem };

  for (const actionSpec of valueTypeActions) {
    const { action } = actionSpec;
    switch (action) {
      case 'deleteField':
        if (actionSpec.valueType === valueItem.type) {
          delete valueItem[actionSpec.field];
        }
        break;
      case 'renameField':
        if (actionSpec.valueType === valueItem.type) {
          if (actionSpec.field in valueItem) {
            valueItem[actionSpec.newName] = valueItem[actionSpec.field];
            delete valueItem[actionSpec.field];
          }
        }
        break;
      case 'deleteType':
        if (actionSpec.valueType === valueItem.type) {
          return null;
        }
        break;
      case 'renameType':
        if (actionSpec.valueType === valueItem.type) {
          valueItem.type = actionSpec.newName;
        }
        break;
      default:
        assertExhaustive(action);
    }
  }
  return valueItem;
}
