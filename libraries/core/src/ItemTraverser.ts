import type {
  AdminSchema,
  AdminValueTypeSpecification,
  EntityLike,
  FieldSpecification,
  ItemValuePath,
  ValueItem,
} from '.';
import { isItemValueItem, isRichTextItemField, isValueTypeItemField, RichTextBlockType } from '.';

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

export function* traverseAdminItem(
  schema: AdminSchema,
  path: ItemValuePath,
  item: EntityLike | ValueItem
): Generator<AdminItemTraverseNode> {
  let fieldSpecs;
  let fields;
  if (!isItemValueItem(item)) {
    const entitySpec = schema.getEntityTypeSpecification(item.info.type);
    if (!entitySpec) {
      const errorNode: AdminItemTraverseNodeError = {
        type: AdminItemTraverseNodeType.error,
        path,
        message: `Couldn't find spec for entity type ${item.info.type}`,
      };
      yield errorNode;
      return;
    }
    fields = item.fields;
    fieldSpecs = entitySpec.fields;
    path = [...path, 'fields'];
  } else {
    const valueSpec = schema.getValueTypeSpecification(item.type);
    if (!valueSpec) {
      const errorNode: AdminItemTraverseNodeError = {
        type: AdminItemTraverseNodeType.error,
        path,
        message: `Couldn't find spec for value type ${item.type}`,
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

    fields = item;
    fieldSpecs = valueSpec.fields;
  }

  for (const fieldSpec of fieldSpecs) {
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
  const fieldValueNode: AdminItemTraverseNodeFieldItem = {
    type: AdminItemTraverseNodeType.fieldItem,
    path,
    fieldSpec,
    value: itemValue,
  };
  yield fieldValueNode;

  if (isValueTypeItemField(fieldSpec, itemValue) && itemValue) {
    yield* traverseAdminItem(schema, path, itemValue);
  } else if (isRichTextItemField(fieldSpec, itemValue) && itemValue) {
    for (let i = 0; i < itemValue.blocks.length; i += 1) {
      const blockPath = [...path, 'blocks', i];
      const block = itemValue.blocks[i];
      if (block.type === RichTextBlockType.valueItem && block.data) {
        yield* traverseAdminItem(schema, [...blockPath, 'data'], block.data as ValueItem);
      }
    }
  }
}
