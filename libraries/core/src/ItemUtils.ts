import { assertExhaustive } from './Asserts.js';
import type { AdminSchema, AdminFieldSpecification, FieldValueTypeMap } from './Schema.js';
import { FieldType, RichTextNodeType } from './Schema.js';
import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  EntityLike,
  PublishedEntity,
  RichText,
  RichTextElementNode,
  RichTextEntityNode,
  RichTextNode,
  RichTextTextNode,
  RichTextValueItemNode,
  ValueItem,
} from './Types.js';

/** Check if `value` with `fieldSpec` is a single boolean field */
export function isBooleanField(
  fieldSpec: AdminFieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.Boolean] | null {
  return fieldSpec.type === FieldType.Boolean && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list boolean field */
export function isBooleanListField(
  fieldSpec: AdminFieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[typeof FieldType.Boolean]> | null {
  return fieldSpec.type === FieldType.Boolean && !!fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single boolean field or an item in a list field */
export function isBooleanItemField(
  fieldSpec: AdminFieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.Boolean] | null {
  return fieldSpec.type === FieldType.Boolean;
}

/** Check if `value` with `fieldSpec` is a single EntityType field */
export function isEntityTypeField(
  fieldSpec: AdminFieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.EntityType] | null {
  return fieldSpec.type === FieldType.EntityType && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list EntityType field */
export function isEntityTypeListField(
  fieldSpec: AdminFieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[typeof FieldType.EntityType]> | null {
  return fieldSpec.type === FieldType.EntityType && !!fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single EntityType field or an item in a list field */
export function isEntityTypeItemField(
  fieldSpec: AdminFieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.EntityType] | null {
  return fieldSpec.type === FieldType.EntityType;
}

/** Check if `value` with `fieldSpec` is a single Location field */
export function isLocationField(
  fieldSpec: AdminFieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.Location] | null {
  return fieldSpec.type === FieldType.Location && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list Location field */
export function isLocationListField(
  fieldSpec: AdminFieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[typeof FieldType.Location]> | null {
  return fieldSpec.type === FieldType.Location && !!fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single Location field or an item in a list field */
export function isLocationItemField(
  fieldSpec: AdminFieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.Location] | null {
  return fieldSpec.type === FieldType.Location;
}

/** Check if `value` with `fieldSpec` is a single String field */
export function isStringField(
  fieldSpec: AdminFieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.String] | null {
  return fieldSpec.type === FieldType.String && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list String field */
export function isStringListField(
  fieldSpec: AdminFieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[typeof FieldType.String]> | null {
  return fieldSpec.type === FieldType.String && !!fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single String field or an item in a list field */
export function isStringItemField(
  fieldSpec: AdminFieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.String] | null {
  return fieldSpec.type === FieldType.String;
}

/** Check if `value` with `fieldSpec` is a single RichText field */
export function isRichTextField(
  fieldSpec: AdminFieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.RichText] | null {
  return fieldSpec.type === FieldType.RichText && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list RichText field */
export function isRichTextListField(
  fieldSpec: AdminFieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[typeof FieldType.RichText]> | null {
  return fieldSpec.type === FieldType.RichText && !!fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single RichText field or an item in a list field */
export function isRichTextItemField(
  fieldSpec: AdminFieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.RichText] | null {
  return fieldSpec.type === FieldType.RichText;
}

/** Check if `value` with `fieldSpec` is a single ValueType field */
export function isValueTypeField(
  fieldSpec: AdminFieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.ValueType] | null {
  return fieldSpec.type === FieldType.ValueType && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list ValueType field */
export function isValueTypeListField(
  fieldSpec: AdminFieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[typeof FieldType.ValueType]> | null {
  return fieldSpec.type === FieldType.ValueType && !!fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single ValueType field or an item in a list field */
export function isValueTypeItemField(
  fieldSpec: AdminFieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.ValueType] | null {
  return fieldSpec.type === FieldType.ValueType;
}

export function isRichTextTextNode(node: RichTextNode): node is RichTextTextNode {
  return node.type === RichTextNodeType.text;
}

export function isRichTextElementNode(node: RichTextNode): node is RichTextElementNode {
  return 'children' in node;
}

export function isRichTextEntityNode(node: RichTextNode): node is RichTextEntityNode {
  return node.type === RichTextNodeType.entity;
}

export function isRichTextValueItemNode(node: RichTextNode): node is RichTextValueItemNode {
  return node.type === RichTextNodeType.valueItem;
}

export function isItemValueItem(
  item:
    | ValueItem
    | PublishedEntity
    | AdminEntity
    | AdminEntityCreate
    | AdminEntityUpdate
    | EntityLike
): item is ValueItem {
  return 'type' in item;
}

export function isItemAdminEntity(
  item: ValueItem | PublishedEntity | AdminEntity
): item is AdminEntity {
  return !isItemValueItem(item) && 'version' in item.info;
}

export function isItemEntity(
  item: ValueItem | PublishedEntity | AdminEntity
): item is PublishedEntity {
  return !isItemValueItem(item) && !isItemAdminEntity(item);
}

export type ItemValuePath = (string | number)[];

export function visitorPathToString(path: ItemValuePath): string {
  let result = '';
  for (const segment of path) {
    if (Number.isInteger(segment)) {
      result += `[${segment}]`;
    } else {
      if (result.length === 0) {
        result += segment;
      } else {
        result += `.${segment}`;
      }
    }
  }
  return result;
}

export function copyEntity<
  T extends AdminEntity<string, object> | AdminEntityCreate | PublishedEntity<string, object>
>(
  entity: T,
  changes: { id?: string; info?: Partial<T['info']>; fields?: Partial<T['fields']> }
): T {
  const copy = { ...entity };
  if (typeof changes.id === 'string') {
    copy.id = changes.id;
  }
  if (changes.info) {
    copy.info = { ...entity.info };
    for (const [key, value] of Object.entries(changes.info)) {
      (copy.info as unknown as Record<string, unknown>)[key] = value;
    }
  }
  if (changes.fields) {
    const fieldsCopy = { ...entity.fields };
    copy.fields = fieldsCopy;
    for (const [key, value] of Object.entries(changes.fields)) {
      fieldsCopy[key] = value;
    }
  }
  return copy;
}

export function isEntityNameAsRequested(currentName: string, requestedName: string): boolean {
  if (requestedName === currentName) {
    return true;
  }
  const hashIndex = currentName.lastIndexOf('#');
  if (hashIndex < 0) {
    return false;
  }
  const currentWithoutUniqueNumber = currentName.slice(0, hashIndex);
  return requestedName === currentWithoutUniqueNumber;
}

export function isFieldValueEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a === null || a === undefined || b === null || b === undefined) {
    return false; // if a or be are not defined they can't be equal
  }

  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (!isFieldValueEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  if (typeof a === 'object') {
    if (typeof b !== 'object' || a === null || b === null) return false;
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (
        !isFieldValueEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
      ) {
        return false;
      }
    }
    return true;
  }

  return false;
}

export function normalizeFieldValue(
  schema: AdminSchema,
  fieldSpec: AdminFieldSpecification,
  value: unknown
): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (fieldSpec.list) {
    if (!Array.isArray(value)) {
      return value; // Invalid
    }

    let changed = false;
    const newList = [];
    for (let i = 0; i < value.length; i += 1) {
      const item = value[i];
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
    return changed ? newList : value;
  }

  return normalizeFieldValueItem(schema, fieldSpec, value);
}

function normalizeFieldValueItem(
  schema: AdminSchema,
  fieldSpec: AdminFieldSpecification,
  value: unknown
) {
  if (value === null) return value;

  const type = fieldSpec.type as FieldType;
  switch (type) {
    case FieldType.Boolean:
    case FieldType.EntityType:
    case FieldType.Location:
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
    case FieldType.ValueType: {
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
