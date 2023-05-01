import { assertExhaustive } from './Asserts.js';
import type { ErrorType, Result } from './ErrorResult.js';
import { notOk, ok } from './ErrorResult.js';
import type {
  AdminFieldSpecification,
  AdminSchema,
  FieldSpecification,
  FieldValueTypeMap,
} from './Schema.js';
import { FieldType, RichTextNodeType } from './Schema.js';
import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  EntityLike,
  PublishedEntity,
  RichText,
  RichTextCodeHighlightNode,
  RichTextCodeNode,
  RichTextElementNode,
  RichTextEntityLinkNode,
  RichTextEntityNode,
  RichTextHeadingNode,
  RichTextLineBreakNode,
  RichTextLinkNode,
  RichTextListItemNode,
  RichTextListNode,
  RichTextNode,
  RichTextParagraphNode,
  RichTextRootNode,
  RichTextTextNode,
  RichTextValueItemNode,
  ValueItem,
} from './Types.js';

type WithRichTextType<TNode extends RichTextNode, TType extends RichTextNodeType> = Omit<
  TNode,
  'type'
> & { type: TType };

/** Check if `value` with `fieldSpec` is a single boolean field */
export function isBooleanField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.Boolean] | null {
  return fieldSpec.type === FieldType.Boolean && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list boolean field */
export function isBooleanListField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[typeof FieldType.Boolean]> | null {
  return fieldSpec.type === FieldType.Boolean && fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single boolean field or an item in a list field */
export function isBooleanItemField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.Boolean] | null {
  return fieldSpec.type === FieldType.Boolean;
}

/** Check if `value` with `fieldSpec` is a single Entity field */
export function isEntityField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.Entity] | null {
  return fieldSpec.type === FieldType.Entity && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list Entity field */
export function isEntityListField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[typeof FieldType.Entity]> | null {
  return fieldSpec.type === FieldType.Entity && fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single Entity field or an item in a list field */
export function isEntityItemField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.Entity] | null {
  return fieldSpec.type === FieldType.Entity;
}

/** Check if `value` with `fieldSpec` is a single Location field */
export function isLocationField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.Location] | null {
  return fieldSpec.type === FieldType.Location && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list Location field */
export function isLocationListField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[typeof FieldType.Location]> | null {
  return fieldSpec.type === FieldType.Location && fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single Location field or an item in a list field */
export function isLocationItemField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.Location] | null {
  return fieldSpec.type === FieldType.Location;
}

/** Check if `value` with `fieldSpec` is a single number field */
export function isNumberField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.Number] | null {
  return fieldSpec.type === FieldType.Number && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list number field */
export function isNumberListField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[typeof FieldType.Number]> | null {
  return fieldSpec.type === FieldType.Number && fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single number field or an item in a list field */
export function isNumberItemField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.Number] | null {
  return fieldSpec.type === FieldType.Number;
}

/** Check if `value` with `fieldSpec` is a single String field */
export function isStringField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.String] | null {
  return fieldSpec.type === FieldType.String && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list String field */
export function isStringListField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[typeof FieldType.String]> | null {
  return fieldSpec.type === FieldType.String && fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single String field or an item in a list field */
export function isStringItemField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.String] | null {
  return fieldSpec.type === FieldType.String;
}

/** Check if `value` with `fieldSpec` is a single RichText field */
export function isRichTextField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.RichText] | null {
  return fieldSpec.type === FieldType.RichText && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list RichText field */
export function isRichTextListField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[typeof FieldType.RichText]> | null {
  return fieldSpec.type === FieldType.RichText && fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single RichText field or an item in a list field */
export function isRichTextItemField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.RichText] | null {
  return fieldSpec.type === FieldType.RichText;
}

/** Check if `value` with `fieldSpec` is a single ValueItem field */
export function isValueItemField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.ValueItem] | null {
  return fieldSpec.type === FieldType.ValueItem && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list ValueItem field */
export function isValueItemListField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is Array<FieldValueTypeMap[typeof FieldType.ValueItem]> | null {
  return fieldSpec.type === FieldType.ValueItem && fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single ValueItem field or an item in a list field */
export function isValueItemItemField(
  fieldSpec: FieldSpecification,
  value: unknown | null
): value is FieldValueTypeMap[typeof FieldType.ValueItem] | null {
  return fieldSpec.type === FieldType.ValueItem;
}

export function isRichTextTextNode(
  node: RichTextNode
): node is WithRichTextType<RichTextTextNode, 'text'> {
  return node.type === RichTextNodeType.text;
}

export function isRichTextLineBreakNode(
  node: RichTextNode
): node is WithRichTextType<RichTextLineBreakNode, 'linebreak'> {
  return node.type === RichTextNodeType.linebreak;
}

export function isRichTextElementNode(node: RichTextNode): node is RichTextElementNode {
  return 'children' in node;
}

export function isRichTextRootNode(node: RichTextNode): node is RichTextRootNode {
  return node.type === RichTextNodeType.root;
}

export function isRichTextParagraphNode(
  node: RichTextNode
): node is WithRichTextType<RichTextParagraphNode, 'paragraph'> {
  return node.type === RichTextNodeType.paragraph;
}

export function isRichTextEntityNode(
  node: RichTextNode
): node is WithRichTextType<RichTextEntityNode, 'entity'> {
  return node.type === RichTextNodeType.entity;
}

export function isRichTextEntityLinkNode(
  node: RichTextNode
): node is WithRichTextType<RichTextEntityLinkNode, 'entityLink'> {
  return node.type === RichTextNodeType.entityLink;
}

export function isRichTextValueItemNode(
  node: RichTextNode
): node is WithRichTextType<RichTextValueItemNode, 'valueItem'> {
  return node.type === RichTextNodeType.valueItem;
}

export function isRichTextCodeNode(
  node: RichTextNode
): node is WithRichTextType<RichTextCodeNode, 'code'> {
  return node.type === RichTextNodeType.code;
}

export function isRichTextCodeHighlightNode(
  node: RichTextNode
): node is WithRichTextType<RichTextCodeHighlightNode, 'code-highlight'> {
  return node.type === RichTextNodeType['code-highlight'];
}

export function isRichTextHeadingNode(
  node: RichTextNode
): node is WithRichTextType<RichTextHeadingNode, 'heading'> {
  return node.type === RichTextNodeType.heading;
}

export function isRichTextLinkNode(
  node: RichTextNode
): node is WithRichTextType<RichTextLinkNode, 'link'> {
  return node.type === RichTextNodeType.link;
}

export function isRichTextListNode(
  node: RichTextNode
): node is WithRichTextType<RichTextListNode, 'list'> {
  return node.type === RichTextNodeType.list;
}

export function isRichTextListItemNode(
  node: RichTextNode
): node is WithRichTextType<RichTextListItemNode, 'listitem'> {
  return node.type === RichTextNodeType.listitem;
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
  T extends
    | AdminEntity<string, object>
    | AdminEntityCreate<AdminEntity<string, object>>
    | PublishedEntity<string, object>
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
    const fieldsCopy: Record<string, unknown> = { ...entity.fields };
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

export function normalizeEntityFields<TEntity extends EntityLike>(
  schema: AdminSchema,
  entity: EntityLike,
  options?: { excludeOmitted: boolean }
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
      entity.fields?.[fieldSpec.name] ?? null
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
  valueItem: TValueItem
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
  value: unknown
): unknown {
  if (value === null || value === undefined) {
    return null;
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
