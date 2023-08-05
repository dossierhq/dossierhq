import { assertExhaustive } from '../Asserts.js';
import type { ErrorType, Result } from '../ErrorResult.js';
import { notOk, ok } from '../ErrorResult.js';
import { isRichTextElementNode } from '../ItemUtils.js';
import type { EntityLike, RichText, ValueItem } from '../Types.js';
import type { AdminSchema } from '../schema/AdminSchema.js';
import type { AdminFieldSpecification } from '../schema/SchemaSpecification.js';
import { FieldType, RichTextNodeType } from '../schema/SchemaSpecification.js';

// TODO move ItemTransformer to core and use it for normalization (null transformer -> normalization)
export function normalizeEntityFields<TEntity extends EntityLike>(
  schema: AdminSchema,
  entity: EntityLike,
  options?: { excludeOmitted: boolean },
): Result<TEntity['fields'], typeof ErrorType.BadRequest> {
  const entitySpec = schema.getEntityTypeSpecification(entity.info.type);
  if (!entitySpec) {
    return notOk.BadRequest(`Entity type ${entity.info.type} doesn’t exist`);
  }

  const unsupportedFieldNames = new Set(Object.keys(entity.fields));

  const fields: Record<string, unknown> = {};
  for (const fieldSpec of entitySpec.fields) {
    unsupportedFieldNames.delete(fieldSpec.name);

    if (options?.excludeOmitted && (!entity.fields || !(fieldSpec.name in entity.fields))) {
      continue;
    }

    const fieldValue = normalizeFieldValue(
      schema,
      fieldSpec,
      entity.fields?.[fieldSpec.name] ?? null,
    );
    fields[fieldSpec.name] = fieldValue;
  }

  if (unsupportedFieldNames.size > 0) {
    return notOk.BadRequest(`Unsupported field names: ${[...unsupportedFieldNames].join(', ')}`);
  }

  return ok(fields);
}

export function normalizeValueItem<TValueItem extends ValueItem>(
  schema: AdminSchema,
  valueItem: TValueItem,
): Result<TValueItem, typeof ErrorType.BadRequest> {
  const valueTypeSpec = schema.getValueTypeSpecification(valueItem.type);
  if (!valueTypeSpec) {
    return notOk.BadRequest(`Value type ${valueItem.type} doesn’t exist`);
  }

  const unsupportedFieldNames = new Set(Object.keys(valueItem));
  unsupportedFieldNames.delete('type');

  const result: ValueItem = { type: valueItem.type };
  for (const fieldSpec of valueTypeSpec.fields) {
    unsupportedFieldNames.delete(fieldSpec.name);

    if (fieldSpec.name === 'type') {
      continue;
    }

    const fieldValue = normalizeFieldValue(schema, fieldSpec, valueItem[fieldSpec.name] ?? null);
    result[fieldSpec.name] = fieldValue;
  }

  if (unsupportedFieldNames.size > 0) {
    return notOk.BadRequest(`Unsupported field names: ${[...unsupportedFieldNames].join(', ')}`);
  }

  return ok(result as TValueItem);
}

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
