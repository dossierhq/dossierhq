import type { ItemValuePath } from './ItemUtils.js';
import {
  isRichTextElementNode,
  isRichTextItemField,
  isRichTextValueItemNode,
  isValueTypeItemField,
} from './ItemUtils.js';
import type {
  AdminEntityTypeSpecification,
  AdminFieldSpecification,
  AdminSchema,
  AdminValueTypeSpecification,
  PublishedEntityTypeSpecification,
  PublishedSchema,
  PublishedValueTypeSpecification,
} from './Schema.js';
import type { EntityLike, RichTextNode, ValueItem } from './Types.js';

export const ItemTraverseNodeType = {
  error: 'error',
  field: 'field',
  fieldItem: 'fieldItem',
  valueItem: 'valueItem',
  richTextNode: 'richTextNode',
} as const;
export type ItemTraverseNodeType = keyof typeof ItemTraverseNodeType;

export type ItemTraverseNode<TSchema extends AdminSchema | PublishedSchema> =
  | ItemTraverseNodeError
  | ItemTraverseNodeField<TSchema>
  | ItemTraverseNodeFieldItem<TSchema>
  | ItemTraverseNodeValueItem<TSchema>
  | ItemTraverseNodeRichTextNode<TSchema>;

interface ItemTraverseNodeError {
  path: ItemValuePath;
  type: 'error';
  message: string;
}

interface ItemTraverseNodeField<TSchema extends AdminSchema | PublishedSchema> {
  path: ItemValuePath;
  type: 'field';
  fieldSpec: TSchema['spec']['entityTypes'][number]['fields'][number];
  value: unknown;
}

interface ItemTraverseNodeFieldItem<TSchema extends AdminSchema | PublishedSchema> {
  path: ItemValuePath;
  type: 'fieldItem';
  fieldSpec: TSchema['spec']['entityTypes'][number]['fields'][number];
  value: unknown;
}

interface ItemTraverseNodeValueItem<TSchema extends AdminSchema | PublishedSchema> {
  path: ItemValuePath;
  type: 'valueItem';
  valueSpec: TSchema['spec']['valueTypes'][number];
  valueItem: ValueItem;
}

interface ItemTraverseNodeRichTextNode<TSchema extends AdminSchema | PublishedSchema> {
  path: ItemValuePath;
  type: 'richTextNode';
  fieldSpec: TSchema['spec']['entityTypes'][number]['fields'][number];
  node: RichTextNode;
}

export function* traverseEntity<TSchema extends AdminSchema | PublishedSchema>(
  schema: TSchema,
  path: ItemValuePath,
  item: EntityLike
): Generator<ItemTraverseNode<TSchema>> {
  const entitySpec = schema.getEntityTypeSpecification(item.info.type);
  if (!entitySpec) {
    const errorNode: ItemTraverseNodeError = {
      type: ItemTraverseNodeType.error,
      path,
      message: `Couldn’t find spec for entity type ${item.info.type}`,
    };
    yield errorNode;
    return;
  }
  yield* traverseItem(schema, [...path, 'fields'], entitySpec, item.fields);
}

export function* traverseValueItem<TSchema extends AdminSchema | PublishedSchema>(
  schema: TSchema,
  path: ItemValuePath,
  item: ValueItem
): Generator<ItemTraverseNode<TSchema>> {
  if (item.type === undefined) {
    const errorNode: ItemTraverseNodeError = {
      type: ItemTraverseNodeType.error,
      path,
      message: 'Missing type',
    };
    yield errorNode;
    return;
  }
  const valueSpec = schema.getValueTypeSpecification(item.type);
  if (!valueSpec) {
    const errorNode: ItemTraverseNodeError = {
      type: ItemTraverseNodeType.error,
      path,
      message: `Couldn’t find spec for value type ${item.type}`,
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
  path: ItemValuePath,
  typeSpec:
    | AdminEntityTypeSpecification
    | AdminValueTypeSpecification
    | PublishedEntityTypeSpecification
    | PublishedValueTypeSpecification,
  fields: Record<string, unknown>
): Generator<ItemTraverseNode<TSchema>> {
  for (const fieldSpec of typeSpec.fields) {
    const fieldPath = [...path, fieldSpec.name];
    const fieldValue = fields?.[fieldSpec.name];

    yield* traverseItemField(schema, fieldPath, fieldSpec, fieldValue);
  }
}

export function* traverseItemField<TSchema extends AdminSchema | PublishedSchema>(
  schema: TSchema,
  path: ItemValuePath,
  fieldSpec: TSchema['spec']['entityTypes'][number]['fields'][number],
  value: unknown
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
      const errorNode: ItemTraverseNodeError = {
        type: ItemTraverseNodeType.error,
        path,
        message: `Expected list got ${typeof value}`,
      };
      yield errorNode;
      return;
    }

    for (let i = 0; i < value.length; i += 1) {
      const fieldItemPath = [...path, i];
      const fieldItem = value[i];
      yield* traverseItemFieldValue(schema, fieldItemPath, fieldSpec, fieldItem);
    }
  } else {
    yield* traverseItemFieldValue(schema, path, fieldSpec, value);
  }
}

function* traverseItemFieldValue<TSchema extends AdminSchema | PublishedSchema>(
  schema: TSchema,
  path: ItemValuePath,
  fieldSpec: AdminFieldSpecification,
  itemValue: unknown
): Generator<ItemTraverseNode<TSchema>> {
  if (Array.isArray(itemValue)) {
    const errorNode: ItemTraverseNodeError = {
      type: ItemTraverseNodeType.error,
      path,
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

  if (isValueTypeItemField(fieldSpec, itemValue) && itemValue) {
    yield* traverseValueItem(schema, path, itemValue);
  } else if (isRichTextItemField(fieldSpec, itemValue) && itemValue) {
    if (typeof itemValue !== 'object') {
      const errorNode: ItemTraverseNodeError = {
        type: ItemTraverseNodeType.error,
        path,
        message: `Expected object got ${typeof itemValue}`,
      };
      yield errorNode;
      return;
    }
    const root = itemValue.root;
    if (root === undefined) {
      const errorNode: ItemTraverseNodeError = {
        type: ItemTraverseNodeType.error,
        path,
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
  path: ItemValuePath,
  fieldSpec: AdminFieldSpecification,
  node: RichTextNode
): Generator<ItemTraverseNode<TSchema>> {
  if (typeof node !== 'object') {
    const errorNode: ItemTraverseNodeError = {
      type: ItemTraverseNodeType.error,
      path,
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
