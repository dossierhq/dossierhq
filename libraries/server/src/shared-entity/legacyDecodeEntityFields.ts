import {
  FieldType,
  isRichTextValueItemNode,
  ok,
  transformRichText,
  type AdminEntityTypeSpecification,
  type AdminFieldSpecification,
  type AdminSchema,
  type ContentValuePath,
  type PublishedEntityTypeSpecification,
  type PublishedFieldSpecification,
  type PublishedSchema,
  type RichText,
  type RichTextValueItemNode,
  type ValueItem,
} from '@dossierhq/core';
import * as LegacyCodecFieldTypeAdapters from './LegacyCodecFieldTypeAdapters.js';

/** `optimized` is the original way of encoding/decoding values, using type adapters and saving less
 * data than the json. Used by entity fields, and value items in entities.
 * For Rich Text, `json` is used, which means values are saved as is. Value items within rich text
 * are encoded as `json`.
 */
type CodecMode = 'optimized' | 'json';

export function legacyDecodeEntityFields(
  schema: AdminSchema | PublishedSchema,
  entitySpec: AdminEntityTypeSpecification | PublishedEntityTypeSpecification,
  encodedFields: Record<string, unknown>,
) {
  const decodedFields: Record<string, unknown> = {};

  for (const fieldSpec of entitySpec.fields) {
    const { name: fieldName } = fieldSpec;
    const fieldValue = encodedFields[fieldName];
    decodedFields[fieldName] = decodeFieldItemOrList(schema, fieldSpec, 'optimized', fieldValue);
  }

  return decodedFields;
}

function decodeFieldItemOrList(
  schema: AdminSchema | PublishedSchema,
  fieldSpec: AdminFieldSpecification | PublishedFieldSpecification,
  codecMode: CodecMode,
  fieldValue: unknown,
) {
  if (fieldValue === null || fieldValue === undefined) {
    return null;
  }
  const fieldAdapter = LegacyCodecFieldTypeAdapters.getAdapter(fieldSpec);
  if (fieldSpec.list) {
    if (!Array.isArray(fieldValue)) {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions
      throw new Error(`Expected list but got ${fieldValue} (${fieldSpec.name})`);
    }
    const decodedItems: unknown[] = [];
    for (const encodedItem of fieldValue) {
      if (fieldSpec.type === FieldType.ValueItem) {
        const decodedItem = decodeValueItemField(schema, codecMode, encodedItem as ValueItem);
        if (decodedItem) {
          decodedItems.push(decodedItem);
        }
      } else if (fieldSpec.type === FieldType.RichText) {
        decodedItems.push(decodeRichTextField(schema, encodedItem as RichText));
      } else {
        decodedItems.push(
          codecMode === 'optimized'
            ? fieldAdapter.decodeData(encodedItem)
            : fieldAdapter.decodeJson(encodedItem),
        );
      }
    }
    return decodedItems.length > 0 ? decodedItems : null;
  }
  if (fieldSpec.type === FieldType.ValueItem) {
    return decodeValueItemField(schema, codecMode, fieldValue as ValueItem);
  }
  if (fieldSpec.type === FieldType.RichText) {
    return decodeRichTextField(schema, fieldValue as RichText);
  }
  return codecMode === 'optimized'
    ? fieldAdapter.decodeData(fieldValue)
    : fieldAdapter.decodeJson(fieldValue);
}

function decodeValueItemField(
  schema: AdminSchema | PublishedSchema,
  codecMode: CodecMode,
  encodedValue: ValueItem,
): ValueItem | null {
  const valueSpec = schema.getValueTypeSpecification(encodedValue.type);
  if (!valueSpec) {
    // Could be that the value type was deleted or made adminOnly (when decoding published entities)
    return null;
  }
  const decodedValue: ValueItem = { type: encodedValue.type };
  for (const fieldFieldSpec of valueSpec.fields) {
    const fieldName = fieldFieldSpec.name;
    const fieldValue = encodedValue[fieldName];
    decodedValue[fieldName] = decodeFieldItemOrList(schema, fieldFieldSpec, codecMode, fieldValue);
  }

  return decodedValue;
}

function decodeRichTextField(
  schema: AdminSchema | PublishedSchema,
  encodedValue: RichText,
): RichText | null {
  const path: ContentValuePath = [];
  return transformRichText(path, encodedValue, (_path, node) => {
    if (isRichTextValueItemNode(node)) {
      const data = decodeValueItemField(schema, 'json', node.data);
      if (!data) {
        return ok(null);
      }
      const newNode: RichTextValueItemNode = { ...node, data };
      return ok(newNode);
    }
    return ok(node);
  }).valueOrThrow();
}
