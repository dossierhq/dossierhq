import {
  isRichTextElementNode,
  isRichTextItemField,
  isRichTextValueItemNode,
  isValueItemItemField,
} from '../ItemUtils.js';
import type { EntityLike, RichTextNode, ValueItem } from '../Types.js';
import type { AdminSchema } from '../schema/AdminSchema.js';
import type { PublishedSchema } from '../schema/PublishedSchema.js';
import type {
  AdminEntityTypeSpecification,
  AdminValueTypeSpecification,
  PublishedEntityTypeSpecification,
  PublishedValueTypeSpecification,
} from '../schema/SchemaSpecification.js';
import type { ContentValuePath } from './ContentPath.js';

export const ItemTraverseNodeType = {
  error: 'error',
  field: 'field',
  fieldItem: 'fieldItem',
  valueItem: 'valueItem',
  richTextNode: 'richTextNode',
} as const;
export type ItemTraverseNodeType = (typeof ItemTraverseNodeType)[keyof typeof ItemTraverseNodeType];

export const ItemTraverseNodeErrorType = {
  generic: 'generic',
  missingTypeSpec: 'missingTypeSpec',
} as const;
export type ItemTraverseNodeErrorType =
  (typeof ItemTraverseNodeErrorType)[keyof typeof ItemTraverseNodeErrorType];

export type ItemTraverseNode<TSchema extends AdminSchema | PublishedSchema> =
  | ItemTraverseNodeErrorGeneric
  | ItemTraverseNodeErrorMissingTypeSpec
  | ItemTraverseNodeField<TSchema>
  | ItemTraverseNodeFieldItem<TSchema>
  | ItemTraverseNodeValueItem<TSchema>
  | ItemTraverseNodeRichTextNode<TSchema>;

interface ItemTraverseNodeErrorGeneric {
  path: ContentValuePath;
  type: 'error';
  errorType: 'generic';
  message: string;
}

interface ItemTraverseNodeErrorMissingTypeSpec {
  path: ContentValuePath;
  type: 'error';
  errorType: 'missingTypeSpec';
  message: string;
  typeName: string;
  kind: 'entity' | 'valueItem';
}

interface ItemTraverseNodeField<TSchema extends AdminSchema | PublishedSchema> {
  path: ContentValuePath;
  type: 'field';
  fieldSpec: TSchema['spec']['entityTypes'][number]['fields'][number];
  value: unknown;
}

interface ItemTraverseNodeFieldItem<TSchema extends AdminSchema | PublishedSchema> {
  path: ContentValuePath;
  type: 'fieldItem';
  fieldSpec: TSchema['spec']['entityTypes'][number]['fields'][number];
  value: unknown;
}

interface ItemTraverseNodeValueItem<TSchema extends AdminSchema | PublishedSchema> {
  path: ContentValuePath;
  type: 'valueItem';
  valueSpec: TSchema['spec']['valueTypes'][number];
  valueItem: ValueItem;
}

interface ItemTraverseNodeRichTextNode<TSchema extends AdminSchema | PublishedSchema> {
  path: ContentValuePath;
  type: 'richTextNode';
  fieldSpec: TSchema['spec']['entityTypes'][number]['fields'][number];
  node: RichTextNode;
}

export function* traverseEntity<TSchema extends AdminSchema | PublishedSchema>(
  schema: TSchema,
  path: ContentValuePath,
  item: EntityLike,
): Generator<ItemTraverseNode<TSchema>> {
  const entitySpec = schema.getEntityTypeSpecification(item.info.type);
  if (!entitySpec) {
    const errorNode: ItemTraverseNodeErrorMissingTypeSpec = {
      type: ItemTraverseNodeType.error,
      path,
      errorType: ItemTraverseNodeErrorType.missingTypeSpec,
      message: `Couldn’t find spec for entity type ${item.info.type}`,
      typeName: item.info.type,
      kind: 'entity',
    };
    yield errorNode;
    return;
  }
  yield* traverseItem(schema, [...path, 'fields'], entitySpec, item.fields);
}

export function* traverseValueItem<TSchema extends AdminSchema | PublishedSchema>(
  schema: TSchema,
  path: ContentValuePath,
  item: ValueItem,
): Generator<ItemTraverseNode<TSchema>> {
  if (item.type === undefined) {
    const errorNode: ItemTraverseNodeErrorGeneric = {
      type: ItemTraverseNodeType.error,
      path,
      errorType: ItemTraverseNodeErrorType.generic,
      message: 'Missing type',
    };
    yield errorNode;
    return;
  }
  const valueSpec = schema.getValueTypeSpecification(item.type);
  if (!valueSpec) {
    const errorNode: ItemTraverseNodeErrorMissingTypeSpec = {
      type: ItemTraverseNodeType.error,
      path,
      errorType: ItemTraverseNodeErrorType.missingTypeSpec,
      message: `Couldn’t find spec for value type ${item.type}`,
      typeName: item.type,
      kind: 'valueItem',
    };
    yield errorNode;
    return;
  }

  const valueItemNode: ItemTraverseNodeValueItem<TSchema> = {
    type: ItemTraverseNodeType.valueItem,
    path,
    valueSpec,
    valueItem: item,
  };
  yield valueItemNode;

  yield* traverseItem(schema, path, valueSpec, item);
}

function* traverseItem<TSchema extends AdminSchema | PublishedSchema>(
  schema: TSchema,
  path: ContentValuePath,
  typeSpec:
    | AdminEntityTypeSpecification
    | AdminValueTypeSpecification
    | PublishedEntityTypeSpecification
    | PublishedValueTypeSpecification,
  fields: Record<string, unknown>,
): Generator<ItemTraverseNode<TSchema>> {
  for (const fieldSpec of typeSpec.fields) {
    const fieldPath = [...path, fieldSpec.name];
    const fieldValue = fields?.[fieldSpec.name];

    yield* traverseItemField(schema, fieldPath, fieldSpec, fieldValue);
  }
}

export function* traverseItemField<TSchema extends AdminSchema | PublishedSchema>(
  schema: TSchema,
  path: ContentValuePath,
  fieldSpec: TSchema['spec']['entityTypes'][number]['fields'][number],
  value: unknown,
): Generator<ItemTraverseNode<TSchema>> {
  const fieldNode: ItemTraverseNodeField<TSchema> = {
    type: ItemTraverseNodeType.field,
    path,
    fieldSpec,
    value,
  };
  yield fieldNode;

  if (fieldSpec.list) {
    if (value === null || value === undefined) {
      return;
    }
    if (!Array.isArray(value)) {
      const errorNode: ItemTraverseNodeErrorGeneric = {
        type: ItemTraverseNodeType.error,
        path,
        errorType: ItemTraverseNodeErrorType.generic,
        message: `Expected list got ${typeof value}`,
      };
      yield errorNode;
      return;
    }

    for (let i = 0; i < value.length; i += 1) {
      const fieldItemPath = [...path, i];
      const fieldItem = value[i] as unknown;
      yield* traverseItemFieldValue(schema, fieldItemPath, fieldSpec, fieldItem);
    }
  } else {
    yield* traverseItemFieldValue(schema, path, fieldSpec, value);
  }
}

function* traverseItemFieldValue<TSchema extends AdminSchema | PublishedSchema>(
  schema: TSchema,
  path: ContentValuePath,
  fieldSpec: TSchema['spec']['entityTypes'][number]['fields'][number],
  itemValue: unknown,
): Generator<ItemTraverseNode<TSchema>> {
  if (Array.isArray(itemValue)) {
    const errorNode: ItemTraverseNodeErrorGeneric = {
      type: ItemTraverseNodeType.error,
      path,
      errorType: ItemTraverseNodeErrorType.generic,
      message: `Expected single ${fieldSpec.type} got list`,
    };
    yield errorNode;
    return;
  }

  const fieldValueNode: ItemTraverseNodeFieldItem<TSchema> = {
    type: ItemTraverseNodeType.fieldItem,
    path,
    fieldSpec,
    value: itemValue,
  };
  yield fieldValueNode;

  if (isValueItemItemField(fieldSpec, itemValue) && itemValue) {
    yield* traverseValueItem(schema, path, itemValue);
  } else if (isRichTextItemField(fieldSpec, itemValue) && itemValue) {
    if (typeof itemValue !== 'object') {
      const errorNode: ItemTraverseNodeErrorGeneric = {
        type: ItemTraverseNodeType.error,
        path,
        errorType: ItemTraverseNodeErrorType.generic,
        message: `Expected object got ${typeof itemValue}`,
      };
      yield errorNode;
      return;
    }
    const root = itemValue.root;
    if (root === undefined) {
      const errorNode: ItemTraverseNodeErrorGeneric = {
        type: ItemTraverseNodeType.error,
        path,
        errorType: ItemTraverseNodeErrorType.generic,
        message: 'Missing root',
      };
      yield errorNode;
      return;
    }
    yield* traverseRichTextNode(schema, path, fieldSpec, root);
  }
}

function* traverseRichTextNode<TSchema extends AdminSchema | PublishedSchema>(
  schema: TSchema,
  path: ContentValuePath,
  fieldSpec: TSchema['spec']['entityTypes'][number]['fields'][number],
  node: RichTextNode,
): Generator<ItemTraverseNode<TSchema>> {
  if (typeof node !== 'object') {
    const errorNode: ItemTraverseNodeErrorGeneric = {
      type: ItemTraverseNodeType.error,
      path,
      errorType: ItemTraverseNodeErrorType.generic,
      message: `Expected object got ${typeof node}`,
    };
    yield errorNode;
    return;
  }

  const traverseNode: ItemTraverseNodeRichTextNode<TSchema> = {
    type: ItemTraverseNodeType.richTextNode,
    path,
    fieldSpec,
    node,
  };
  yield traverseNode;

  if (isRichTextValueItemNode(node) && node.data) {
    yield* traverseValueItem(schema, [...path, 'data'], node.data);
  }
  if (isRichTextElementNode(node)) {
    for (let i = 0; i < node.children.length; i += 1) {
      const childPath = [...path, i];
      const child = node.children[i];
      yield* traverseRichTextNode(schema, childPath, fieldSpec, child);
    }
  }
}
