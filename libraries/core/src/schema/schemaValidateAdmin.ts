import { notOk, ok, type ErrorType, type Result } from '../ErrorResult.js';
import { RichTextNodeType } from '../Types.js';
import type { BaseSchema } from './BaseSchema.js';
import type {
  AdminEntityTypeSpecification,
  AdminFieldSpecification,
  AdminSchemaSpecification,
  BooleanFieldSpecification,
  ComponentFieldSpecification,
  EntityFieldSpecification,
  LocationFieldSpecification,
  NumberFieldSpecification,
  RichTextFieldSpecification,
  StringFieldSpecification,
} from './SchemaSpecification.js';
import {
  FieldType,
  GROUPED_RICH_TEXT_NODE_TYPES,
  REQUIRED_RICH_TEXT_NODES,
} from './SchemaSpecification.js';

const CAMEL_CASE_PATTERN = /^[a-z][a-zA-Z0-9_]*$/;
const PASCAL_CASE_PATTERN = /^[A-Z][a-zA-Z0-9_]*$/;

const ADMIN_SHARED_FIELD_SPECIFICATION_KEYS = [
  'name',
  'list',
  'required',
  'adminOnly',
  'type',
] as const;

const ADMIN_FIELD_SPECIFICATION_KEYS: {
  Boolean: readonly (keyof AdminFieldSpecification<BooleanFieldSpecification>)[];
  Component: readonly (keyof AdminFieldSpecification<ComponentFieldSpecification>)[];
  Entity: readonly (keyof AdminFieldSpecification<EntityFieldSpecification>)[];
  Location: readonly (keyof AdminFieldSpecification<LocationFieldSpecification>)[];
  Number: readonly (keyof AdminFieldSpecification<NumberFieldSpecification>)[];
  RichText: readonly (keyof AdminFieldSpecification<RichTextFieldSpecification>)[];
  String: readonly (keyof AdminFieldSpecification<StringFieldSpecification>)[];
} = {
  [FieldType.Boolean]: ADMIN_SHARED_FIELD_SPECIFICATION_KEYS,
  [FieldType.Component]: [...ADMIN_SHARED_FIELD_SPECIFICATION_KEYS, 'componentTypes'],
  [FieldType.Entity]: [...ADMIN_SHARED_FIELD_SPECIFICATION_KEYS, 'entityTypes'],
  [FieldType.Location]: ADMIN_SHARED_FIELD_SPECIFICATION_KEYS,
  [FieldType.Number]: [...ADMIN_SHARED_FIELD_SPECIFICATION_KEYS, 'integer'],
  [FieldType.RichText]: [
    ...ADMIN_SHARED_FIELD_SPECIFICATION_KEYS,
    'entityTypes',
    'linkEntityTypes',
    'componentTypes',
    'richTextNodes',
  ],
  [FieldType.String]: [
    ...ADMIN_SHARED_FIELD_SPECIFICATION_KEYS,
    'multiline',
    'matchPattern',
    'values',
    'index',
  ],
};

export function schemaValidateAdmin(
  adminSchema: BaseSchema<AdminSchemaSpecification>,
): Result<void, typeof ErrorType.BadRequest> {
  const usedTypeNames = new Set<string>();
  for (const typeSpec of [...adminSchema.spec.entityTypes, ...adminSchema.spec.componentTypes]) {
    const isComponentType = adminSchema.spec.componentTypes.includes(typeSpec);

    if (!PASCAL_CASE_PATTERN.test(typeSpec.name)) {
      return notOk.BadRequest(
        `${typeSpec.name}: The type name has to start with an upper-case letter (A-Z) and can only contain letters (a-z, A-Z), numbers and underscore (_), such as MyType_123`,
      );
    }
    if (usedTypeNames.has(typeSpec.name)) {
      return notOk.BadRequest(`${typeSpec.name}: Duplicate type name`);
    }
    usedTypeNames.add(typeSpec.name);

    if (!isComponentType) {
      const authKeyPattern = (typeSpec as AdminEntityTypeSpecification).authKeyPattern;
      if (authKeyPattern) {
        if (!adminSchema.getPattern(authKeyPattern)) {
          return notOk.BadRequest(`${typeSpec.name}: Unknown authKeyPattern (${authKeyPattern})`);
        }
      }
      const nameField = (typeSpec as AdminEntityTypeSpecification).nameField;
      if (nameField) {
        const nameFieldSpec = typeSpec.fields.find((fieldSpec) => fieldSpec.name === nameField);
        if (!nameFieldSpec) {
          return notOk.BadRequest(
            `${typeSpec.name}: Found no field matching nameField (${nameField})`,
          );
        }
        if (nameFieldSpec.type !== FieldType.String || nameFieldSpec.list) {
          return notOk.BadRequest(
            `${typeSpec.name}: nameField (${nameField}) should be a string (non-list)`,
          );
        }
      }
    }

    const usedFieldNames = new Set<string>();
    for (const fieldSpec of typeSpec.fields) {
      if (!CAMEL_CASE_PATTERN.test(fieldSpec.name)) {
        return notOk.BadRequest(
          `${typeSpec.name}.${fieldSpec.name}: The field name has to start with a lower-case letter (a-z) and can only contain letters (a-z, A-Z), numbers and underscore (_), such as myField_123`,
        );
      }
      if (isComponentType && fieldSpec.name === 'type') {
        return notOk.BadRequest(
          `${typeSpec.name}.${fieldSpec.name}: Invalid field name for a component type`,
        );
      }
      if (usedFieldNames.has(fieldSpec.name)) {
        return notOk.BadRequest(`${typeSpec.name}.${fieldSpec.name}: Duplicate field name`);
      }
      usedFieldNames.add(fieldSpec.name);

      if (!(fieldSpec.type in FieldType)) {
        return notOk.BadRequest(
          `${typeSpec.name}.${fieldSpec.name}: Specified type ${fieldSpec.type} doesn’t exist`,
        );
      }

      for (const key of Object.keys(fieldSpec)) {
        if (!(ADMIN_FIELD_SPECIFICATION_KEYS[fieldSpec.type] as string[]).includes(key)) {
          return notOk.BadRequest(
            `${typeSpec.name}.${fieldSpec.name}: Field with type ${fieldSpec.type} shouldn’t specify ${key}`,
          );
        }
      }

      if (
        (fieldSpec.type === FieldType.Entity || fieldSpec.type === FieldType.RichText) &&
        fieldSpec.entityTypes &&
        fieldSpec.entityTypes.length > 0
      ) {
        for (const referencedTypeName of fieldSpec.entityTypes) {
          const referencedEntityType = adminSchema.getEntityTypeSpecification(referencedTypeName);
          if (!referencedEntityType) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: Referenced entity type in entityTypes ${referencedTypeName} doesn’t exist`,
            );
          }
          if (referencedEntityType.adminOnly && !typeSpec.adminOnly && !fieldSpec.adminOnly) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: Referenced entity type in entityTypes (${referencedTypeName}) is adminOnly, but neither ${typeSpec.name} nor ${fieldSpec.name} are adminOnly`,
            );
          }
        }
      }

      if (
        fieldSpec.type === FieldType.RichText &&
        fieldSpec.linkEntityTypes &&
        fieldSpec.linkEntityTypes.length > 0
      ) {
        for (const referencedTypeName of fieldSpec.linkEntityTypes) {
          const referencedEntityType = adminSchema.getEntityTypeSpecification(referencedTypeName);
          if (!referencedEntityType) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: Referenced entity type in linkEntityTypes ${referencedTypeName} doesn’t exist`,
            );
          }
          if (referencedEntityType.adminOnly && !typeSpec.adminOnly && !fieldSpec.adminOnly) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: Referenced entity type in linkEntityTypes (${referencedTypeName}) is adminOnly, but neither ${typeSpec.name} nor ${fieldSpec.name} are adminOnly`,
            );
          }
        }
      }

      if (
        (fieldSpec.type === FieldType.Component || fieldSpec.type === FieldType.RichText) &&
        fieldSpec.componentTypes &&
        fieldSpec.componentTypes.length > 0
      ) {
        for (const referencedTypeName of fieldSpec.componentTypes) {
          const referencedComponentType =
            adminSchema.getComponentTypeSpecification(referencedTypeName);
          if (!referencedComponentType) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: Component type in componentTypes ${referencedTypeName} doesn’t exist`,
            );
          }
          if (referencedComponentType.adminOnly && !typeSpec.adminOnly && !fieldSpec.adminOnly) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: Referenced component type in componentTypes (${referencedTypeName}) is adminOnly, but neither ${typeSpec.name} nor ${fieldSpec.name} are adminOnly`,
            );
          }
        }
      }

      if (
        fieldSpec.type === FieldType.RichText &&
        fieldSpec.richTextNodes &&
        fieldSpec.richTextNodes.length > 0
      ) {
        const usedRichTextNodes = new Set<string>();
        for (const richTextNode of fieldSpec.richTextNodes) {
          if (usedRichTextNodes.has(richTextNode)) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: richTextNodes with type ${richTextNode} is duplicated`,
            );
          }
          usedRichTextNodes.add(richTextNode);
        }

        const missingNodeTypes = REQUIRED_RICH_TEXT_NODES.filter(
          (it) => !usedRichTextNodes.has(it),
        );
        if (missingNodeTypes.length > 0) {
          return notOk.BadRequest(
            `${typeSpec.name}.${fieldSpec.name}: richTextNodes must include ${missingNodeTypes.join(
              ', ',
            )}`,
          );
        }

        for (const nodeGroup of GROUPED_RICH_TEXT_NODE_TYPES) {
          const usedNodesInGroup = nodeGroup.filter((it) => usedRichTextNodes.has(it));
          if (usedNodesInGroup.length > 0 && usedNodesInGroup.length !== nodeGroup.length) {
            const unusedNodesInGroup = nodeGroup.filter((it) => !usedRichTextNodes.has(it));
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: richTextNodes includes ${usedNodesInGroup.join(
                ', ',
              )} but must also include related ${unusedNodesInGroup.join(', ')}`,
            );
          }
        }

        if (usedRichTextNodes.size > 0) {
          if (
            fieldSpec.componentTypes &&
            fieldSpec.componentTypes.length > 0 &&
            !usedRichTextNodes.has(RichTextNodeType.component)
          ) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: componentTypes is specified for field, but richTextNodes is missing component`,
            );
          }

          if (
            fieldSpec.entityTypes &&
            fieldSpec.entityTypes.length > 0 &&
            !usedRichTextNodes.has(RichTextNodeType.entity)
          ) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: entityTypes is specified for field, but richTextNodes is missing entity`,
            );
          }

          if (
            fieldSpec.linkEntityTypes &&
            fieldSpec.linkEntityTypes.length > 0 &&
            !usedRichTextNodes.has(RichTextNodeType.entityLink)
          ) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: linkEntityTypes is specified for field, but richTextNodes is missing entityLink`,
            );
          }

          // Renamed after v 0.4.7
          if (usedRichTextNodes.has('valueItem')) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: richTextNodes can’t include valueItem, it has been renamed to component`,
            );
          }
        }
      }

      if (fieldSpec.type === FieldType.String && fieldSpec.matchPattern) {
        const pattern = adminSchema.getPattern(fieldSpec.matchPattern);
        if (!pattern) {
          return notOk.BadRequest(
            `${typeSpec.name}.${fieldSpec.name}: Unknown matchPattern (${fieldSpec.matchPattern})`,
          );
        }
      }

      if (
        fieldSpec.type === FieldType.String &&
        fieldSpec.matchPattern &&
        fieldSpec.values.length > 0
      ) {
        return notOk.BadRequest(
          `${typeSpec.name}.${fieldSpec.name}: Can’t specify both matchPattern and values`,
        );
      }

      if (fieldSpec.type === FieldType.String && fieldSpec.index) {
        const index = adminSchema.getIndex(fieldSpec.index);
        if (!index) {
          return notOk.BadRequest(
            `${typeSpec.name}.${fieldSpec.name}: Unknown index (${fieldSpec.index})`,
          );
        }
      }
    }
  }

  const usedPatterns = new Set<string>();
  for (const patternSpec of adminSchema.spec.patterns) {
    if (usedPatterns.has(patternSpec.name)) {
      return notOk.BadRequest(`${patternSpec.name}: Duplicate pattern name`);
    }
    if (!CAMEL_CASE_PATTERN.test(patternSpec.name)) {
      return notOk.BadRequest(
        `${patternSpec.name}: The pattern name has to start with a lower-case letter (a-z) and can only contain letters (a-z, A-Z), numbers and underscore (_), such as myPattern_123`,
      );
    }
    usedPatterns.add(patternSpec.name);

    try {
      new RegExp(patternSpec.pattern);
    } catch (e) {
      return notOk.BadRequest(`${patternSpec.name}: Invalid regex`);
    }
  }

  const usedIndexes = new Set<string>();
  for (const indexSpec of adminSchema.spec.indexes) {
    if (usedIndexes.has(indexSpec.name)) {
      return notOk.BadRequest(`${indexSpec.name}: Duplicate index name`);
    }
    if (!CAMEL_CASE_PATTERN.test(indexSpec.name)) {
      return notOk.BadRequest(
        `${indexSpec.name}: The index name has to start with a lower-case letter (a-z) and can only contain letters (a-z, A-Z), numbers and underscore (_), such as myIndex_123`,
      );
    }
    usedIndexes.add(indexSpec.name);
  }

  return ok(undefined);
}
