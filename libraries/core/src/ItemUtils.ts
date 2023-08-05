import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  EntityLike,
  PublishedEntity,
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
  RichTextTabNode,
  RichTextTextNode,
  RichTextValueItemNode,
  ValueItem,
} from './Types.js';
import { RichTextNodeType } from './Types.js';
import type { FieldSpecification, FieldValueTypeMap } from './schema/SchemaSpecification.js';
import { FieldType } from './schema/SchemaSpecification.js';

type WithRichTextType<TNode extends RichTextNode, TType extends RichTextNodeType> = Omit<
  TNode,
  'type'
> & { type: TType };

/** Check if `value` with `fieldSpec` is a single boolean field */
export function isBooleanField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.Boolean] | null {
  return fieldSpec.type === FieldType.Boolean && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list boolean field */
export function isBooleanListField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.Boolean][] | null {
  return fieldSpec.type === FieldType.Boolean && fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single boolean field or an item in a list field */
export function isBooleanItemField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.Boolean] | null {
  return fieldSpec.type === FieldType.Boolean;
}

/** Check if `value` with `fieldSpec` is a single Entity field */
export function isEntityField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.Entity] | null {
  return fieldSpec.type === FieldType.Entity && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list Entity field */
export function isEntityListField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.Entity][] | null {
  return fieldSpec.type === FieldType.Entity && fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single Entity field or an item in a list field */
export function isEntityItemField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.Entity] | null {
  return fieldSpec.type === FieldType.Entity;
}

/** Check if `value` with `fieldSpec` is a single Location field */
export function isLocationField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.Location] | null {
  return fieldSpec.type === FieldType.Location && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list Location field */
export function isLocationListField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.Location][] | null {
  return fieldSpec.type === FieldType.Location && fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single Location field or an item in a list field */
export function isLocationItemField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.Location] | null {
  return fieldSpec.type === FieldType.Location;
}

/** Check if `value` with `fieldSpec` is a single number field */
export function isNumberField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.Number] | null {
  return fieldSpec.type === FieldType.Number && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list number field */
export function isNumberListField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.Number][] | null {
  return fieldSpec.type === FieldType.Number && fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single number field or an item in a list field */
export function isNumberItemField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.Number] | null {
  return fieldSpec.type === FieldType.Number;
}

/** Check if `value` with `fieldSpec` is a single String field */
export function isStringField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.String] | null {
  return fieldSpec.type === FieldType.String && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list String field */
export function isStringListField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.String][] | null {
  return fieldSpec.type === FieldType.String && fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single String field or an item in a list field */
export function isStringItemField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.String] | null {
  return fieldSpec.type === FieldType.String;
}

/** Check if `value` with `fieldSpec` is a single RichText field */
export function isRichTextField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.RichText] | null {
  return fieldSpec.type === FieldType.RichText && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list RichText field */
export function isRichTextListField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.RichText][] | null {
  return fieldSpec.type === FieldType.RichText && fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single RichText field or an item in a list field */
export function isRichTextItemField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.RichText] | null {
  return fieldSpec.type === FieldType.RichText;
}

/** Check if `value` with `fieldSpec` is a single ValueItem field */
export function isValueItemField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.ValueItem] | null {
  return fieldSpec.type === FieldType.ValueItem && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list ValueItem field */
export function isValueItemListField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.ValueItem][] | null {
  return fieldSpec.type === FieldType.ValueItem && fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single ValueItem field or an item in a list field */
export function isValueItemItemField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.ValueItem] | null {
  return fieldSpec.type === FieldType.ValueItem;
}

export function isRichTextTextNode(
  node: RichTextNode,
): node is WithRichTextType<RichTextTextNode, 'text'> {
  return node.type === RichTextNodeType.text;
}

export function isRichTextLineBreakNode(
  node: RichTextNode,
): node is WithRichTextType<RichTextLineBreakNode, 'linebreak'> {
  return node.type === RichTextNodeType.linebreak;
}

export function isRichTextTabNode(
  node: RichTextNode,
): node is WithRichTextType<RichTextTabNode, 'tab'> {
  return node.type === RichTextNodeType.tab;
}

export function isRichTextElementNode(node: RichTextNode): node is RichTextElementNode {
  return 'children' in node;
}

export function isRichTextRootNode(node: RichTextNode): node is RichTextRootNode {
  return node.type === RichTextNodeType.root;
}

export function isRichTextParagraphNode(
  node: RichTextNode,
): node is WithRichTextType<RichTextParagraphNode, 'paragraph'> {
  return node.type === RichTextNodeType.paragraph;
}

export function isRichTextEntityNode(
  node: RichTextNode,
): node is WithRichTextType<RichTextEntityNode, 'entity'> {
  return node.type === RichTextNodeType.entity;
}

export function isRichTextEntityLinkNode(
  node: RichTextNode,
): node is WithRichTextType<RichTextEntityLinkNode, 'entityLink'> {
  return node.type === RichTextNodeType.entityLink;
}

export function isRichTextValueItemNode(
  node: RichTextNode,
): node is WithRichTextType<RichTextValueItemNode, 'valueItem'> {
  return node.type === RichTextNodeType.valueItem;
}

export function isRichTextCodeNode(
  node: RichTextNode,
): node is WithRichTextType<RichTextCodeNode, 'code'> {
  return node.type === RichTextNodeType.code;
}

export function isRichTextCodeHighlightNode(
  node: RichTextNode,
): node is WithRichTextType<RichTextCodeHighlightNode, 'code-highlight'> {
  return node.type === RichTextNodeType['code-highlight'];
}

export function isRichTextHeadingNode(
  node: RichTextNode,
): node is WithRichTextType<RichTextHeadingNode, 'heading'> {
  return node.type === RichTextNodeType.heading;
}

export function isRichTextLinkNode(
  node: RichTextNode,
): node is WithRichTextType<RichTextLinkNode, 'link'> {
  return node.type === RichTextNodeType.link;
}

export function isRichTextListNode(
  node: RichTextNode,
): node is WithRichTextType<RichTextListNode, 'list'> {
  return node.type === RichTextNodeType.list;
}

export function isRichTextListItemNode(
  node: RichTextNode,
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
    | EntityLike,
): item is ValueItem {
  return 'type' in item;
}

export function isItemAdminEntity(
  item: ValueItem | PublishedEntity | AdminEntity,
): item is AdminEntity {
  return !isItemValueItem(item) && 'version' in item.info;
}

export function isItemEntity(
  item: ValueItem | PublishedEntity | AdminEntity,
): item is PublishedEntity {
  return !isItemValueItem(item) && !isItemAdminEntity(item);
}

export function copyEntity<
  T extends
    | AdminEntity<string, object>
    | AdminEntityCreate<AdminEntity<string, object>>
    | PublishedEntity<string, object>,
>(
  entity: T,
  changes: { id?: string; info?: Partial<T['info']>; fields?: Partial<T['fields']> },
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

  // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
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
