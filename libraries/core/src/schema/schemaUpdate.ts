import { assertExhaustive } from '../Asserts.js';
import { notOk, ok, type ErrorType, type Result } from '../ErrorResult.js';
import { isFieldValueEqual } from '../ItemUtils.js';
import type { BaseSchema } from './BaseSchema.js';
import {
  FieldType,
  type AdminEntityTypeSpecification,
  type AdminFieldSpecification,
  type AdminFieldSpecificationUpdate,
  type AdminSchemaSpecificationUpdate,
  type AdminSchemaSpecificationWithMigrations,
  type AdminValueTypeSpecification,
  type EntityFieldSpecification,
  type NumberFieldSpecification,
  type RichTextFieldSpecification,
  type StringFieldSpecification,
  type ValueItemFieldSpecification,
} from './SchemaSpecification.js';

export function schemaUpdate(
  current: BaseSchema<AdminSchemaSpecificationWithMigrations>,
  update: AdminSchemaSpecificationUpdate,
): Result<AdminSchemaSpecificationWithMigrations, typeof ErrorType.BadRequest> {
  const schemaSpec: AdminSchemaSpecificationWithMigrations = {
    version: current.spec.version,
    entityTypes: [...current.spec.entityTypes],
    valueTypes: [...current.spec.valueTypes],
    patterns: [],
    indexes: [],
    migrations: [...current.spec.migrations],
  };

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

      if (existingEntitySpec) {
        if (existingEntitySpec.adminOnly !== adminOnly) {
          return notOk.BadRequest(
            `${existingEntitySpec.name}: Can’t change the value of adminOnly. Requested ${adminOnly} but is ${existingEntitySpec.adminOnly}`,
          );
        }
      }

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

      if (existingValueSpec) {
        if (existingValueSpec.adminOnly !== adminOnly) {
          return notOk.BadRequest(
            `${valueSpecUpdate.name}: Can’t change the value of adminOnly. Requested ${adminOnly} but is ${existingValueSpec.adminOnly}`,
          );
        }
      }

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

  // Merge used patterns
  for (const patternName of [...usedPatterns].sort()) {
    const pattern =
      update.patterns?.find((it) => it.name === patternName) ?? current.getPattern(patternName);
    if (!pattern) {
      return notOk.BadRequest(`Pattern ${patternName} is used, but not defined`);
    }
    schemaSpec.patterns.push(pattern);
  }

  // Merge used indexes
  for (const indexName of [...usedIndexes].sort()) {
    const index =
      update.indexes?.find((it) => it.name === indexName) ?? current.getIndex(indexName);
    if (!index) {
      return notOk.BadRequest(`Index ${indexName} is used, but not defined`);
    }
    schemaSpec.indexes.push(index);
  }

  // Sort everything
  schemaSpec.entityTypes.sort((a, b) => a.name.localeCompare(b.name));
  schemaSpec.valueTypes.sort((a, b) => a.name.localeCompare(b.name));
  schemaSpec.patterns.sort((a, b) => a.name.localeCompare(b.name));
  schemaSpec.indexes.sort((a, b) => a.name.localeCompare(b.name));

  // Detect if changed and bump version
  if (isFieldValueEqual(current.spec, schemaSpec)) {
    return ok(current.spec); // no change
  }
  schemaSpec.version += 1;

  return ok(schemaSpec);
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
    if (existingFieldSpec.adminOnly !== adminOnly) {
      return notOk.BadRequest(
        `${typeName}.${name}: Can’t change the value of adminOnly. Requested ${adminOnly} but is ${existingFieldSpec.adminOnly}`,
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

      if (existingStringFieldSpec) {
        if (existingStringFieldSpec.index !== index) {
          return notOk.BadRequest(
            `${existingTypeSpec?.name}.${name}: Can’t change the value of index. Requested ${index} but is ${existingStringFieldSpec.index}`,
          );
        }
      }

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

export function valueOrExistingOrDefault<T>(
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
