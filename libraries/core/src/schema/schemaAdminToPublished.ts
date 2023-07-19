import type { BaseSchema } from './BaseSchema.js';
import {
  FieldType,
  type AdminFieldSpecification,
  type AdminSchemaSpecification,
  type PublishedFieldSpecification,
  type PublishedSchemaSpecification,
} from './SchemaSpecification.js';

export function schemaAdminToPublished(adminSchema: BaseSchema<AdminSchemaSpecification>) {
  const spec: PublishedSchemaSpecification = {
    schemaKind: 'published',
    version: adminSchema.spec.version,
    entityTypes: [],
    valueTypes: [],
    patterns: [],
    indexes: [],
  };

  function toPublishedFields(fields: AdminFieldSpecification[]): PublishedFieldSpecification[] {
    return fields
      .filter((it) => !it.adminOnly)
      .map((field) => {
        const { adminOnly, ...publishedField } = field;
        return publishedField;
      });
  }

  const usedPatternNames = new Set();
  for (const entitySpec of adminSchema.spec.entityTypes) {
    if (entitySpec.adminOnly) {
      continue;
    }
    spec.entityTypes.push({
      name: entitySpec.name,
      authKeyPattern: entitySpec.authKeyPattern,
      fields: toPublishedFields(entitySpec.fields),
    });
    if (entitySpec.authKeyPattern) {
      usedPatternNames.add(entitySpec.authKeyPattern);
    }
  }

  for (const valueSpec of adminSchema.spec.valueTypes) {
    if (valueSpec.adminOnly) {
      continue;
    }
    spec.valueTypes.push({ name: valueSpec.name, fields: toPublishedFields(valueSpec.fields) });
  }

  const usedIndexNames = new Set();
  for (const typeSpec of [...spec.entityTypes, ...spec.valueTypes]) {
    for (const fieldSpec of typeSpec.fields) {
      if (fieldSpec.type !== FieldType.String) continue;
      if (fieldSpec.matchPattern) {
        usedPatternNames.add(fieldSpec.matchPattern);
      }
      if (fieldSpec.index) {
        usedIndexNames.add(fieldSpec.index);
      }
    }
  }

  for (const patternName of [...usedPatternNames].sort()) {
    const pattern = adminSchema.spec.patterns.find((it) => it.name === patternName);
    if (pattern) {
      spec.patterns.push(pattern);
    }
  }

  for (const indexName of [...usedIndexNames].sort()) {
    const index = adminSchema.spec.indexes.find((it) => it.name === indexName);
    if (index) {
      spec.indexes.push(index);
    }
  }

  return spec;
}
