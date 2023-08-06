import { type ErrorType, type Result } from '../ErrorResult.js';
import { RichTextNodeType, type EntityLike, type RichText, type ValueItem } from '../Types.js';
import type { AdminSchema } from '../schema/AdminSchema.js';
import type { AdminFieldSpecification } from '../schema/SchemaSpecification.js';
import { FieldType } from '../schema/SchemaSpecification.js';
import { assertExhaustive } from '../utils/Asserts.js';
import type { ContentValuePath } from './ContentPath.js';
import {
  IDENTITY_TRANSFORMER,
  transformEntityFields,
  transformValueItem,
} from './ContentTransformer.js';
import { isRichTextElementNode } from './ContentTypeUtils.js';

export function normalizeEntityFields<TEntity extends EntityLike<string, object>>(
  schema: AdminSchema,
  path: ContentValuePath,
  entity: Readonly<TEntity>,
  options?: { excludeOmittedEntityFields: boolean },
): Result<TEntity['fields'], typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  return transformEntityFields(schema, [...path, 'fields'], entity, IDENTITY_TRANSFORMER, options);
}

export function normalizeValueItem<TValueItem extends ValueItem<string, object>>(
  schema: AdminSchema,
  path: ContentValuePath,
  valueItem: Readonly<TValueItem>,
): Result<TValueItem, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  return transformValueItem(schema, path, valueItem, IDENTITY_TRANSFORMER);
}

//TODO add path
//TODO add result
//TODO use transformer
export function normalizeFieldValue(
  schema: AdminSchema,
  fieldSpec: AdminFieldSpecification,
  value: unknown,
): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  if (fieldSpec.list) {
    if (!Array.isArray(value)) {
      return value; // Invalid
    }

    let changed = false;
    const newList: unknown[] = [];
    for (const item of value) {
      const normalizedItem = normalizeFieldValueItem(schema, fieldSpec, item);
      if (item !== normalizedItem || normalizedItem === null) {
        changed = true;
      }
      if (normalizedItem !== null) {
        newList.push(normalizedItem);
      }
    }

    if (newList.length === 0) {
      return null;
    }
    return changed ? newList : (value as unknown[]);
  }

  return normalizeFieldValueItem(schema, fieldSpec, value);
}

function normalizeFieldValueItem(
  schema: AdminSchema,
  fieldSpec: AdminFieldSpecification,
  value: unknown,
) {
  if (value === null) return value;

  const type = fieldSpec.type as FieldType;
  switch (type) {
    case FieldType.Boolean:
    case FieldType.Entity:
    case FieldType.Location:
    case FieldType.Number:
      return value;
    case FieldType.RichText: {
      // TODO normalize ValueItem nodes?
      // Don't fail on invalid rich text, just ignore it in this phase
      const richText = value as RichText;
      if (
        typeof richText === 'object' &&
        typeof richText.root === 'object' &&
        Array.isArray(richText.root.children) &&
        richText.root.children.length === 1
      ) {
        const onlyChild = richText.root.children[0];
        if (
          onlyChild.type === RichTextNodeType.paragraph &&
          isRichTextElementNode(onlyChild) &&
          onlyChild.children.length === 0
        ) {
          return null;
        }
      }
      return value;
    }
    case FieldType.String:
      //TODO support trimming of strings?
      return value ? value : null;
    case FieldType.ValueItem: {
      const valueItem = value as ValueItem;
      const newValueItem: ValueItem = { type: valueItem.type };
      let changed = false;

      const valueSpec = schema.getValueTypeSpecification(valueItem.type);
      if (!valueSpec) {
        return value; // Invalid
      }
      for (const fieldFieldSpec of valueSpec.fields) {
        const fieldName = fieldFieldSpec.name;
        const fieldValue = valueItem[fieldName];
        const normalizedFieldValue =
          normalizeFieldValue(schema, fieldFieldSpec, fieldValue) ?? null;
        newValueItem[fieldName] = normalizedFieldValue;
        if (normalizedFieldValue !== fieldValue) {
          changed = true;
        }
      }

      for (const [fieldName, fieldValue] of Object.entries(valueItem)) {
        if (!(fieldName in newValueItem)) {
          // Invalid, so just reuse initial value
          newValueItem[fieldName] = fieldValue;
        }
      }

      return changed ? newValueItem : valueItem;
    }
    default: {
      assertExhaustive(type);
    }
  }
}
