import {
  assertIsDefined,
  isRichTextField,
  isRichTextItemField,
  isValueItemField,
  isValueItemItemField,
  type AdminEntityTypeSpecification,
  type AdminFieldSpecification,
  type AdminSchema,
  type ContentValuePath,
  type RichText,
  type ValueItem,
} from '@dossierhq/core';
import * as LegacyCodecFieldTypeAdapters from './LegacyCodecFieldTypeAdapters.js';

export function legacyEncodeEntityFields(
  schema: AdminSchema,
  entitySpec: AdminEntityTypeSpecification,
  path: ContentValuePath,
  fields: Record<string, unknown>,
) {
  const encodedFields: Record<string, unknown> = {};

  for (const fieldSpec of entitySpec.fields) {
    if (fields && fieldSpec.name in fields) {
      const value = fields[fieldSpec.name];
      if (value === null || value === undefined) {
        continue;
      }
      const fieldPath = [...path, 'fields', fieldSpec.name];
      const encodedValue = encodeFieldItemOrList(schema, fieldSpec, fieldPath, value);
      encodedFields[fieldSpec.name] = encodedValue;
    }
  }

  return encodedFields;
}

function encodeFieldItemOrList(
  schema: AdminSchema,
  fieldSpec: AdminFieldSpecification,
  path: ContentValuePath,
  data: unknown,
) {
  const fieldAdapter = LegacyCodecFieldTypeAdapters.getAdapter(fieldSpec);
  if (fieldSpec.list) {
    const encodedItems: unknown[] = [];
    for (let i = 0; i < (data as []).length; i++) {
      const decodedItem = (data as unknown[])[i];
      const itemPath = [...path, i];

      let encodedItem: unknown;
      if (isValueItemItemField(fieldSpec, decodedItem)) {
        encodedItem = encodeValueItemField(schema, itemPath, decodedItem);
      } else if (isRichTextItemField(fieldSpec, decodedItem)) {
        encodedItem = encodeRichTextField(decodedItem);
      } else {
        encodedItem = fieldAdapter.encodeData(decodedItem);
      }
      if (encodedItem !== null) {
        encodedItems.push(encodedItem);
      }
    }
    return encodedItems.length > 0 ? encodedItems : null;
  }

  if (isValueItemField(fieldSpec, data)) {
    return encodeValueItemField(schema, path, data);
  } else if (isRichTextField(fieldSpec, data)) {
    return encodeRichTextField(data);
  }
  return fieldAdapter.encodeData(data);
}

function encodeValueItemField(
  schema: AdminSchema,
  path: ContentValuePath,
  data: ValueItem | null,
): ValueItem | null {
  if (!data) return null;

  const value = data;
  const valueType = value.type;
  const valueSpec = schema.getValueTypeSpecification(valueType);
  assertIsDefined(valueSpec);

  const encodedValue: ValueItem = { type: valueType };

  for (const fieldSpec of valueSpec.fields) {
    const fieldValue = value[fieldSpec.name];
    if (fieldValue === null || fieldValue === undefined) {
      continue; // Skip empty fields
    }
    const fieldPath = [...path, fieldSpec.name];
    const encodedFieldValue = encodeFieldItemOrList(schema, fieldSpec, fieldPath, fieldValue);
    encodedValue[fieldSpec.name] = encodedFieldValue;
  }

  return encodedValue;
}

function encodeRichTextField(data: RichText | null) {
  return data;
}
