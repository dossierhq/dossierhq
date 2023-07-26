import { assertExhaustive } from '../Asserts.js';
import { notOk, ok, type ErrorType, type Result } from '../ErrorResult.js';
import { isFieldValueEqual } from '../ItemUtils.js';
import {
  FieldType,
  type AdminEntityTypeSpecification,
  type AdminFieldSpecification,
  type AdminFieldSpecificationUpdate,
  type AdminSchemaSpecificationUpdate,
  type AdminSchemaSpecificationWithMigrations,
  type AdminSchemaVersionMigration,
  type AdminValueTypeSpecification,
  type EntityFieldSpecification,
  type NumberFieldSpecification,
  type RichTextFieldSpecification,
  type StringFieldSpecification,
  type ValueItemFieldSpecification,
} from './SchemaSpecification.js';

export function schemaUpdate(
  currentSchemaSpec: AdminSchemaSpecificationWithMigrations,
  update: AdminSchemaSpecificationUpdate,
): Result<AdminSchemaSpecificationWithMigrations, typeof ErrorType.BadRequest> {
  const schemaSpec = JSON.parse(
    JSON.stringify(currentSchemaSpec),
  ) as AdminSchemaSpecificationWithMigrations;

  const mergeMigrationsResult = mergeMigrations(update, schemaSpec);
  if (mergeMigrationsResult.isError()) return mergeMigrationsResult;
  const currentMigration = mergeMigrationsResult.value;

  const applyMigrationsResult = applyMigrationsToSchema(currentMigration, schemaSpec);
  if (applyMigrationsResult.isError()) return applyMigrationsResult;

  // Merge entity types
  if (update.entityTypes) {
    for (const entitySpecUpdate of update.entityTypes) {
      const existingIndex = schemaSpec.entityTypes.findIndex(
        (it) => it.name === entitySpecUpdate.name,
      );
      const existingEntitySpec = existingIndex >= 0 ? schemaSpec.entityTypes[existingIndex] : null;

      const adminOnly = valueOrExistingOrDefault(
        entitySpecUpdate.adminOnly,
        existingEntitySpec?.adminOnly,
        false,
      );
      const authKeyPattern = valueOrExistingOrDefault(
        entitySpecUpdate.authKeyPattern,
        existingEntitySpec?.authKeyPattern,
        null,
      );
      const nameField = valueOrExistingOrDefault(
        entitySpecUpdate.nameField,
        existingEntitySpec?.nameField,
        null,
      );

      const collectFieldsResult = collectFieldSpecsFromUpdates(
        entitySpecUpdate.fields,
        existingEntitySpec,
      );
      if (collectFieldsResult.isError()) return collectFieldsResult;
      const entitySpec: AdminEntityTypeSpecification = {
        name: entitySpecUpdate.name,
        adminOnly,
        authKeyPattern,
        nameField,
        fields: collectFieldsResult.value,
      };
      if (existingIndex >= 0) {
        schemaSpec.entityTypes[existingIndex] = entitySpec;
      } else {
        schemaSpec.entityTypes.push(entitySpec);
      }

      // Version 0.2.3: moved isName from field to nameField on entity types, isName is deprecated
      const fieldWithIsName = entitySpecUpdate.fields.find((it) => 'isName' in it);
      if (fieldWithIsName) {
        return notOk.BadRequest(
          `${entitySpec.name}.${fieldWithIsName.name}: isName is specified, use nameField on the type instead`,
        );
      }
    }
  }

  // Merge value types
  if (update.valueTypes) {
    for (const valueSpecUpdate of update.valueTypes) {
      const existingIndex = schemaSpec.valueTypes.findIndex(
        (it) => it.name === valueSpecUpdate.name,
      );
      const existingValueSpec = existingIndex >= 0 ? schemaSpec.valueTypes[existingIndex] : null;

      const adminOnly = valueOrExistingOrDefault(
        valueSpecUpdate.adminOnly,
        existingValueSpec?.adminOnly,
        false,
      );

      const collectFieldsResult = collectFieldSpecsFromUpdates(
        valueSpecUpdate.fields,
        existingValueSpec,
      );
      if (collectFieldsResult.isError()) return collectFieldsResult;
      const valueSpec = {
        name: valueSpecUpdate.name,
        adminOnly,
        fields: collectFieldsResult.value,
      };
      if (existingIndex >= 0) {
        schemaSpec.valueTypes[existingIndex] = valueSpec;
      } else {
        schemaSpec.valueTypes.push(valueSpec);
      }
    }
  }

  // Check with patterns and indexes are used
  const usedPatterns = new Set(
    schemaSpec.entityTypes.map((it) => it.authKeyPattern).filter((it) => !!it) as string[],
  );
  const usedIndexes = new Set<string>();
  for (const typeSpec of [...schemaSpec.entityTypes, ...schemaSpec.valueTypes]) {
    for (const fieldSpec of typeSpec.fields) {
      if (fieldSpec.type !== FieldType.String) continue;
      if (fieldSpec.matchPattern) {
        usedPatterns.add(fieldSpec.matchPattern);
      }
      if (fieldSpec.index) {
        usedIndexes.add(fieldSpec.index);
      }
    }
  }

  // Merge patterns
  for (const pattern of update.patterns ?? []) {
    const existingPatternIndex = schemaSpec.patterns.findIndex((it) => it.name === pattern.name);
    if (existingPatternIndex >= 0) {
      schemaSpec.patterns[existingPatternIndex] = pattern;
    } else {
      schemaSpec.patterns.push(pattern);
    }
  }

  // Delete unused patterns and check that all used patterns are defined
  const unspecifiedPatternNames = new Set(usedPatterns);
  schemaSpec.patterns = schemaSpec.patterns.filter((it) => {
    unspecifiedPatternNames.delete(it.name);
    return usedPatterns.has(it.name);
  });
  if (unspecifiedPatternNames.size > 0) {
    return notOk.BadRequest(
      `Pattern ${[...unspecifiedPatternNames].join(', ')} is used, but not defined`,
    );
  }

  // Merge indexes
  for (const index of update.indexes ?? []) {
    const existingIndexIndex = schemaSpec.indexes.findIndex((it) => it.name === index.name);
    if (existingIndexIndex >= 0) {
      schemaSpec.indexes[existingIndexIndex] = index;
    } else {
      schemaSpec.indexes.push(index);
    }
  }

  // Delete unused indexes and check that all used indexes are defined
  const unspecifiedIndexNames = new Set(usedIndexes);
  schemaSpec.indexes = schemaSpec.indexes.filter((it) => {
    unspecifiedIndexNames.delete(it.name);
    return usedIndexes.has(it.name);
  });
  if (unspecifiedIndexNames.size > 0) {
    return notOk.BadRequest(
      `Index ${[...unspecifiedIndexNames].join(', ')} is used, but not defined`,
    );
  }

  // Sort everything
  schemaSpec.entityTypes.sort((a, b) => a.name.localeCompare(b.name));
  schemaSpec.valueTypes.sort((a, b) => a.name.localeCompare(b.name));
  schemaSpec.patterns.sort((a, b) => a.name.localeCompare(b.name));
  schemaSpec.indexes.sort((a, b) => a.name.localeCompare(b.name));
  schemaSpec.migrations.sort((a, b) => b.version - a.version);

  // Detect if changed and bump version
  if (isFieldValueEqual(currentSchemaSpec, schemaSpec)) {
    return ok(currentSchemaSpec); // no change
  }
  schemaSpec.version += 1;

  return ok(schemaSpec);
}

function mergeMigrations(
  update: AdminSchemaSpecificationUpdate,
  updatedSpec: AdminSchemaSpecificationWithMigrations,
): Result<AdminSchemaVersionMigration | null, typeof ErrorType.BadRequest> {
  let currentMigration: AdminSchemaVersionMigration | null = null;

  for (const newMigration of update.migrations ?? []) {
    const existingMigration = updatedSpec.migrations.find(
      (it) => it.version === newMigration.version,
    );
    if (existingMigration) {
      if (!isFieldValueEqual(existingMigration, newMigration)) {
        return notOk.BadRequest(`Migration ${newMigration.version} is already defined`);
      }
    } else {
      if (newMigration.version !== updatedSpec.version + 1) {
        return notOk.BadRequest(
          `New migration ${newMigration.version} must be the same as the schema new version ${
            updatedSpec.version + 1
          }`,
        );
      } else {
        if (currentMigration) {
          return notOk.BadRequest(`Duplicate migrations for version ${newMigration.version}`);
        }
        currentMigration = newMigration;
      }
    }
  }

  if (currentMigration?.actions.length === 0) {
    currentMigration = null;
  }

  if (currentMigration) {
    updatedSpec.migrations.unshift(currentMigration);
  }

  return ok(currentMigration);
}

function applyMigrationsToSchema(
  migration: AdminSchemaVersionMigration | null,
  schemaSpec: AdminSchemaSpecificationWithMigrations,
): Result<void, typeof ErrorType.BadRequest> {
  if (!migration) {
    return ok(undefined);
  }

  for (const actionSpec of migration.actions) {
    const { action } = actionSpec;
    switch (action) {
      case 'deleteField': {
        const result = applyFieldMigration(
          schemaSpec,
          actionSpec,
          (typeSpec, _fieldSpec, fieldIndex) => {
            // remove field
            typeSpec.fields.splice(fieldIndex, 1);

            // Reset nameField if it was deleted
            if ('nameField' in typeSpec && typeSpec.nameField === actionSpec.field) {
              typeSpec.nameField = null;
            }
          },
        );
        if (result.isError()) return result;
        break;
      }
      case 'deleteType': {
        const result = applyTypeMigration(
          schemaSpec,
          actionSpec,
          (typeSpecs, _typeSpec, typeIndex) => {
            typeSpecs.splice(typeIndex, 1);
          },
        );
        if (result.isError()) return result;

        applyTypeMigrationToTypeReferences(schemaSpec, actionSpec, (references, typeIndex) => {
          references.splice(typeIndex, 1);
        });
        break;
      }
      case 'renameField': {
        const result = applyFieldMigration(
          schemaSpec,
          actionSpec,
          (typeSpec, fieldSpec, _fieldIndex) => {
            fieldSpec.name = actionSpec.newName;

            // Change nameField if it was renamed
            if ('nameField' in typeSpec && typeSpec.nameField === actionSpec.field) {
              typeSpec.nameField = actionSpec.newName;
            }
          },
        );
        if (result.isError()) return result;
        break;
      }
      case 'renameType':
        return notOk.BadRequest('TODO Not implemented (renameType)');
      default:
        assertExhaustive(action);
    }
  }

  return ok(undefined);
}

function applyFieldMigration(
  schemaSpec: AdminSchemaSpecificationWithMigrations,
  actionSpec:
    | { action: string; entityType: string; field: string }
    | { action: string; valueType: string; field: string },
  apply: (
    typeSpec: AdminEntityTypeSpecification | AdminValueTypeSpecification,
    fieldSpec: AdminFieldSpecification,
    fieldIndex: number,
  ) => void,
) {
  let typeSpecs: (AdminEntityTypeSpecification | AdminValueTypeSpecification)[];
  let typeName: string;
  if ('entityType' in actionSpec) {
    typeSpecs = schemaSpec.entityTypes;
    typeName = actionSpec.entityType;
  } else {
    typeSpecs = schemaSpec.valueTypes;
    typeName = actionSpec.valueType;
  }

  const typeSpec = typeSpecs.find((it) => it.name === typeName);
  if (!typeSpec) {
    return notOk.BadRequest(
      `Type for migration ${actionSpec.action} ${typeName}.${actionSpec.field} does not exist`,
    );
  }

  const fieldIndex = typeSpec.fields.findIndex((it) => it.name === actionSpec.field);
  if (fieldIndex < 0) {
    return notOk.BadRequest(
      `Field for migration ${actionSpec.action} ${typeName}.${actionSpec.field} does not exist`,
    );
  }

  apply(typeSpec, typeSpec.fields[fieldIndex], fieldIndex);

  return ok(undefined);
}

function applyTypeMigration(
  schemaSpec: AdminSchemaSpecificationWithMigrations,
  actionSpec: { action: string; entityType: string } | { action: string; valueType: string },
  apply: (
    typeSpecs: (AdminEntityTypeSpecification | AdminValueTypeSpecification)[],
    typeSpec: AdminEntityTypeSpecification | AdminValueTypeSpecification,
    typeIndex: number,
  ) => void,
) {
  let typeSpecs: (AdminEntityTypeSpecification | AdminValueTypeSpecification)[];
  let typeName: string;
  if ('entityType' in actionSpec) {
    typeSpecs = schemaSpec.entityTypes;
    typeName = actionSpec.entityType;
  } else {
    typeSpecs = schemaSpec.valueTypes;
    typeName = actionSpec.valueType;
  }

  const typeIndex = typeSpecs.findIndex((it) => it.name === typeName);
  if (typeIndex < 0) {
    return notOk.BadRequest(`Type for migration ${actionSpec.action} ${typeName} does not exist`);
  }

  const typeSpec = typeSpecs[typeIndex];

  apply(typeSpecs, typeSpec, typeIndex);

  return ok(undefined);
}

function applyTypeMigrationToTypeReferences(
  schemaSpec: AdminSchemaSpecificationWithMigrations,
  actionSpec: { action: string; entityType: string } | { action: string; valueType: string },
  apply: (references: string[], typeIndex: number) => void,
) {
  const typeName = 'entityType' in actionSpec ? actionSpec.entityType : actionSpec.valueType;
  for (const typeSpec of [...schemaSpec.entityTypes, ...schemaSpec.valueTypes]) {
    for (const fieldSpec of typeSpec.fields) {
      for (const property of 'entityType' in actionSpec
        ? ['entityTypes', 'linkEntityTypes']
        : ['valueTypes']) {
        if (property in fieldSpec) {
          const references = (fieldSpec as unknown as Record<string, string[]>)[property];
          const index = references.indexOf(typeName);
          if (index >= 0) {
            apply(references, index);
          }
        }
      }
    }
  }
}

function collectFieldSpecsFromUpdates(
  fieldUpdates: AdminFieldSpecificationUpdate[],
  existingTypeSpec: AdminEntityTypeSpecification | AdminValueTypeSpecification | null,
): Result<AdminFieldSpecification[], typeof ErrorType.BadRequest> {
  const fields: AdminFieldSpecification[] = [];
  const usedFieldNames = new Set<string>();
  for (const fieldUpdate of fieldUpdates) {
    const fieldResult = mergeAndNormalizeUpdatedFieldSpec(fieldUpdate, existingTypeSpec);
    if (fieldResult.isError()) return fieldResult;
    fields.push(fieldResult.value);

    usedFieldNames.add(fieldUpdate.name);
  }

  // Add existing fields that are not updated
  if (existingTypeSpec) {
    for (const fieldSpec of existingTypeSpec.fields) {
      if (!usedFieldNames.has(fieldSpec.name)) {
        fields.push(fieldSpec);
      }
    }
  }

  return ok(fields);
}

function mergeAndNormalizeUpdatedFieldSpec(
  fieldSpecUpdate: AdminFieldSpecificationUpdate,
  existingTypeSpec: AdminEntityTypeSpecification | AdminValueTypeSpecification | null,
): Result<AdminFieldSpecification, typeof ErrorType.BadRequest> {
  const existingFieldSpec = existingTypeSpec?.fields.find((it) => it.name === fieldSpecUpdate.name);

  const { name, type } = fieldSpecUpdate;
  const list = valueOrExistingOrDefault(fieldSpecUpdate.list, existingFieldSpec?.list, false);
  const required = valueOrExistingOrDefault(
    fieldSpecUpdate.required,
    existingFieldSpec?.required,
    false,
  );
  const adminOnly = valueOrExistingOrDefault(
    fieldSpecUpdate.adminOnly,
    existingFieldSpec?.adminOnly,
    false,
  );

  if (existingTypeSpec && existingFieldSpec) {
    const typeName = existingTypeSpec.name;
    if (existingFieldSpec.type !== type) {
      return notOk.BadRequest(
        `${typeName}.${name}: Can’t change type of field. Requested ${type} but is ${existingFieldSpec.type}`,
      );
    }
    if (existingFieldSpec.list !== list) {
      return notOk.BadRequest(
        `${typeName}.${name}: Can’t change the value of list. Requested ${list} but is ${existingFieldSpec.list}`,
      );
    }
  }

  switch (type) {
    case FieldType.Boolean:
      return ok({ name, type, list, required, adminOnly });
    case FieldType.Entity: {
      const existingEntityFieldSpec = existingFieldSpec as
        | AdminFieldSpecification<EntityFieldSpecification>
        | undefined;
      const entityTypes = sortAndRemoveDuplicates(
        valueOrExistingOrDefault(
          fieldSpecUpdate.entityTypes,
          existingEntityFieldSpec?.entityTypes,
          [],
        ),
      );
      return ok({
        name,
        type,
        list,
        required,
        adminOnly,
        entityTypes,
      });
    }
    case FieldType.Location:
      return ok({ name, type, list, required, adminOnly });
    case FieldType.Number: {
      const existingNumberFieldSpec = existingFieldSpec as
        | AdminFieldSpecification<NumberFieldSpecification>
        | undefined;
      const integer = valueOrExistingOrDefault(
        fieldSpecUpdate.integer,
        existingNumberFieldSpec?.integer,
        false,
      );
      return ok({
        name,
        type,
        list,
        required,
        adminOnly,
        integer,
      });
    }
    case FieldType.RichText: {
      const existingRichTextFieldSpec = existingFieldSpec as
        | AdminFieldSpecification<RichTextFieldSpecification>
        | undefined;

      const richTextNodes = sortAndRemoveDuplicates(
        valueOrExistingOrDefault(
          fieldSpecUpdate.richTextNodes,
          existingRichTextFieldSpec?.richTextNodes,
          [],
        ),
      );

      const entityTypes = sortAndRemoveDuplicates(
        valueOrExistingOrDefault(
          fieldSpecUpdate.entityTypes,
          existingRichTextFieldSpec?.entityTypes,
          [],
        ),
      );

      const linkEntityTypes = sortAndRemoveDuplicates(
        valueOrExistingOrDefault(
          fieldSpecUpdate.linkEntityTypes,
          existingRichTextFieldSpec?.linkEntityTypes,
          [],
        ),
      );

      const valueTypes = sortAndRemoveDuplicates(
        valueOrExistingOrDefault(
          fieldSpecUpdate.valueTypes,
          existingRichTextFieldSpec?.valueTypes,
          [],
        ),
      );

      return ok({
        name,
        type,
        list,
        required,
        adminOnly,
        richTextNodes,
        entityTypes,
        linkEntityTypes,
        valueTypes,
      });
    }
    case FieldType.String: {
      const existingStringFieldSpec = existingFieldSpec as
        | AdminFieldSpecification<StringFieldSpecification>
        | undefined;

      const multiline = valueOrExistingOrDefault(
        fieldSpecUpdate.multiline,
        existingStringFieldSpec?.multiline,
        false,
      );

      const matchPattern = valueOrExistingOrDefault(
        fieldSpecUpdate.matchPattern,
        existingStringFieldSpec?.matchPattern,
        null,
      );

      const values = [
        ...valueOrExistingOrDefault(fieldSpecUpdate.values, existingStringFieldSpec?.values, []),
      ].sort((a, b) => a.value.localeCompare(b.value));
      removeDuplicatesFromSorted(values, (it) => it.value);

      const index = valueOrExistingOrDefault(
        fieldSpecUpdate.index,
        existingStringFieldSpec?.index,
        null,
      );

      return ok({
        name,
        type,
        list,
        required,
        adminOnly,
        multiline,
        matchPattern,
        values,
        index,
      });
    }
    case FieldType.ValueItem: {
      const existingValueItemFieldSpec = existingFieldSpec as
        | AdminFieldSpecification<ValueItemFieldSpecification>
        | undefined;
      const valueTypes = sortAndRemoveDuplicates(
        valueOrExistingOrDefault(
          fieldSpecUpdate.valueTypes,
          existingValueItemFieldSpec?.valueTypes,
          [],
        ),
      );
      return ok({
        name,
        type,
        list,
        required,
        adminOnly,
        valueTypes,
      });
    }
    default:
      assertExhaustive(type);
  }
}

function valueOrExistingOrDefault<T>(
  update: T | undefined,
  existing: T | undefined,
  defaultValue: T,
): T {
  if (update !== undefined) return update;
  if (existing !== undefined) return existing;
  return defaultValue;
}

function sortAndRemoveDuplicates(values: string[]) {
  if (values.length <= 1) {
    return values;
  }
  const copy = [...values].sort();
  removeDuplicatesFromSorted(copy);
  return copy;
}

function removeDuplicatesFromSorted<T>(values: T[], predicate: (value: T) => unknown = (it) => it) {
  for (let i = values.length - 1; i > 0; i--) {
    if (predicate(values[i]) === predicate(values[i - 1])) {
      values.splice(i, 1);
    }
  }
}
