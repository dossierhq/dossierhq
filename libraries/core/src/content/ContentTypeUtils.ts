import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  Component,
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
  RichTextComponentNode,
} from '../Types.js';
import { RichTextNodeType } from '../Types.js';
import type { FieldSpecification, FieldValueTypeMap } from '../schema/SchemaSpecification.js';
import { FieldType } from '../schema/SchemaSpecification.js';

type WithRichTextType<TNode extends RichTextNode, TType extends RichTextNodeType> = Omit<
  TNode,
  'type'
> & { type: TType };

/** Check if `value` with `fieldSpec` is a single boolean field */
export function isBooleanSingleField(
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

/** Check if `value` with `fieldSpec` is a single Component field */
export function isComponentSingleField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.Component] | null {
  return fieldSpec.type === FieldType.Component && !fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is a list Component field */
export function isComponentListField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.Component][] | null {
  return fieldSpec.type === FieldType.Component && fieldSpec.list;
}

/** Check if `value` with `fieldSpec` is either a single Component field or an item in a list field */
export function isComponentItemField(
  fieldSpec: FieldSpecification,
  value: unknown,
): value is FieldValueTypeMap[typeof FieldType.Component] | null {
  return fieldSpec.type === FieldType.Component;
}

/** Check if `value` with `fieldSpec` is a single Entity field */
export function isEntitySingleField(
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
export function isLocationSingleField(
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
export function isNumberSingleField(
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
export function isStringSingleField(
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
export function isRichTextSingleField(
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

export function isRichTextComponentNode(
  node: RichTextNode,
): node is WithRichTextType<RichTextComponentNode, 'component'> {
  return node.type === RichTextNodeType.component;
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

export function isComponent(
  item:
    | Component
    | PublishedEntity
    | AdminEntity
    | AdminEntityCreate
    | AdminEntityUpdate
    | EntityLike,
): item is Component {
  return 'type' in item;
}

export function isAdminEntity(
  item: Component | PublishedEntity | AdminEntity,
): item is AdminEntity {
  return !isComponent(item) && 'version' in item.info;
}

export function isPublishedEntity(
  item: Component | PublishedEntity | AdminEntity,
): item is PublishedEntity {
  return !isComponent(item) && !isAdminEntity(item);
}
