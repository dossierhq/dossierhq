import type { ItemValuePath } from './ItemUtils.js';
import {
  isRichTextElementNode,
  isRichTextItemField,
  isRichTextValueItemNode,
  isValueTypeItemField,
} from './ItemUtils.js';
import type {
  AdminEntityTypeSpecification,
  AdminSchema,
  AdminValueTypeSpecification,
  FieldSpecification,
} from './Schema.js';
import type { EntityLike, RichTextNode, ValueItem } from './Types.js';

export const AdminItemTraverseNodeType = {
  error: 'error',
  field: 'field',
  fieldItem: 'fieldItem',
  valueItem: 'valueItem',
} as const;
export type AdminItemTraverseNodeType = keyof typeof AdminItemTraverseNodeType;

export type AdminItemTraverseNode =
  | AdminItemTraverseNodeError
  | AdminItemTraverseNodeField
  | AdminItemTraverseNodeFieldItem
  | AdminItemTraverseNodeValueItem;

interface AdminItemTraverseNodeError {
  path: ItemValuePath;
  type: 'error';
  message: string;
}

interface AdminItemTraverseNodeField {
  path: ItemValuePath;
  type: 'field';
  fieldSpec: FieldSpecification;
  value: unknown;
}

interface AdminItemTraverseNodeFieldItem {
  path: ItemValuePath;
  type: 'fieldItem';
  fieldSpec: FieldSpecification;
  value: unknown;
}

interface AdminItemTraverseNodeValueItem {
  path: ItemValuePath;
  type: 'valueItem';
  valueSpec: AdminValueTypeSpecification;
  valueItem: ValueItem;
}

export function* traverseAdminEntity(
  schema: AdminSchema,
  path: ItemValuePath,
  item: EntityLike
): Generator<AdminItemTraverseNode> {
  const entitySpec = schema.getEntityTypeSpecification(item.info.type);
  if (!entitySpec) {
    const errorNode: AdminItemTraverseNodeError = {
      type: AdminItemTraverseNodeType.error,
      path,
      message: `Couldn’t find spec for entity type ${item.info.type}`,
    };
    yield errorNode;
    return;
  }
  yield* traverseAdminItem(schema, [...path, 'fields'], entitySpec, item.fields);
}

export function* traverseAdminValueItem(
  schema: AdminSchema,
  path: ItemValuePath,
  item: ValueItem
): Generator<AdminItemTraverseNode> {
  if (item.type === undefined) {
    const errorNode: AdminItemTraverseNodeError = {
      type: AdminItemTraverseNodeType.error,
      path,
      message: 'Missing type',
    };
    yield errorNode;
    return;
  }
  const valueSpec = schema.getValueTypeSpecification(item.type);
  if (!valueSpec) {
    const errorNode: AdminItemTraverseNodeError = {
      type: AdminItemTraverseNodeType.error,
      path,
      message: `Couldn’t find spec for value type ${item.type}`,
    };
    yield errorNode;
    return;
  }

  const valueItemNode: AdminItemTraverseNodeValueItem = {
    type: AdminItemTraverseNodeType.valueItem,
    path,
    valueSpec,
    valueItem: item,
  };
  yield valueItemNode;

  yield* traverseAdminItem(schema, path, valueSpec, item);
}

function* traverseAdminItem(
  schema: AdminSchema,
  path: ItemValuePath,
  typeSpec: AdminEntityTypeSpecification | AdminValueTypeSpecification,
  fields: Record<string, unknown>
): Generator<AdminItemTraverseNode> {
  for (const fieldSpec of typeSpec.fields) {
    const fieldPath = [...path, fieldSpec.name];
    const fieldValue = fields?.[fieldSpec.name];

    yield* traverseAdminItemField(schema, fieldPath, fieldSpec, fieldValue);
  }
}

export function* traverseAdminItemField(
  schema: AdminSchema,
  path: ItemValuePath,
  fieldSpec: FieldSpecification,
  value: unknown
): Generator<AdminItemTraverseNode> {
  const fieldNode: AdminItemTraverseNodeField = {
    type: AdminItemTraverseNodeType.field,
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
      const errorNode: AdminItemTraverseNodeError = {
        type: AdminItemTraverseNodeType.error,
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

function* traverseItemFieldValue(
  schema: AdminSchema,
  path: ItemValuePath,
  fieldSpec: FieldSpecification,
  itemValue: unknown
): Generator<AdminItemTraverseNode> {
  if (Array.isArray(itemValue)) {
    const errorNode: AdminItemTraverseNodeError = {
      type: AdminItemTraverseNodeType.error,
      path,
      message: `Expected single ${fieldSpec.type} got list`,
    };
    yield errorNode;
    return;
  }

  const fieldValueNode: AdminItemTraverseNodeFieldItem = {
    type: AdminItemTraverseNodeType.fieldItem,
    path,
    fieldSpec,
    value: itemValue,
  };
  yield fieldValueNode;

  if (isValueTypeItemField(fieldSpec, itemValue) && itemValue) {
    yield* traverseAdminValueItem(schema, path, itemValue);
  } else if (isRichTextItemField(fieldSpec, itemValue) && itemValue) {
    if (typeof itemValue !== 'object') {
      const errorNode: AdminItemTraverseNodeError = {
        type: AdminItemTraverseNodeType.error,
        path,
        message: `Expected object got ${typeof itemValue}`,
      };
      yield errorNode;
      return;
    }
    const root = itemValue.root;
    if (root === undefined) {
      const errorNode: AdminItemTraverseNodeError = {
        type: AdminItemTraverseNodeType.error,
        path,
        message: 'Missing root',
      };
      yield errorNode;
      return;
    }
    yield* traverseRichTextNode(schema, path, root);
  }
}

function* traverseRichTextNode(
  schema: AdminSchema,
  path: ItemValuePath,
  node: RichTextNode
): Generator<AdminItemTraverseNode> {
  if (typeof node !== 'object') {
    const errorNode: AdminItemTraverseNodeError = {
      type: AdminItemTraverseNodeType.error,
      path,
      message: `Expected object got ${typeof node}`,
    };
    yield errorNode;
    return;
  }

  if (isRichTextValueItemNode(node) && node.data) {
    yield* traverseAdminValueItem(schema, [...path, 'data'], node.data);
  }
  if (isRichTextElementNode(node)) {
    for (let i = 0; i < node.children.length; i += 1) {
      const childPath = [...path, i];
      const child = node.children[i];
      yield* traverseRichTextNode(schema, childPath, child);
    }
  }
}
