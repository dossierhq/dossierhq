import type { BaseSchema } from './BaseSchema.js';
import {
  FieldType,
  type FieldSpecification,
  type PublishedFieldSpecification,
  type PublishedSchemaSpecification,
  type SchemaSpecification,
} from './SchemaSpecification.js';

export function schemaToPublished(schema: BaseSchema<SchemaSpecification>) {
  const spec: PublishedSchemaSpecification = {
    schemaKind: 'published',
    version: schema.spec.version,
    entityTypes: [],
    componentTypes: [],
    patterns: [],
    indexes: [],
  };

  function toPublishedFields(fields: FieldSpecification[]): PublishedFieldSpecification[] {
    return fields
      .filter((it) => !it.adminOnly)
      .map((field) => {
        const { adminOnly, ...publishedField } = field;
        return publishedField;
      });
  }

  const usedPatternNames = new Set();
  for (const entitySpec of schema.spec.entityTypes) {
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

  for (const componentSpec of schema.spec.componentTypes) {
    if (componentSpec.adminOnly) {
      continue;
    }
    spec.componentTypes.push({
      name: componentSpec.name,
      fields: toPublishedFields(componentSpec.fields),
    });
  }

  const usedIndexNames = new Set();
  for (const typeSpec of [...spec.entityTypes, ...spec.componentTypes]) {
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
    const pattern = schema.spec.patterns.find((it) => it.name === patternName);
    if (pattern) {
      spec.patterns.push(pattern);
    }
  }

  for (const indexName of [...usedIndexNames].sort()) {
    const index = schema.spec.indexes.find((it) => it.name === indexName);
    if (index) {
      spec.indexes.push(index);
    }
  }

  return spec;
}
