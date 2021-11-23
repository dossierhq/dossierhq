import type {
  AdminEntity,
  AdminSchema,
  AdminValueTypeSpecification,
  FieldSpecification,
  ItemValuePath,
  ValueItem,
} from '.';
import { isItemValueItem, isRichTextItemField, isValueTypeItemField, RichTextBlockType } from '.';

export enum ItemTraverseNodeType {
  error = 'error',
  field = 'field',
  valueItem = 'valueItem',
}

export type ItemTraverseNode =
  | ItemTraverseNodeError
  | ItemTraverseNodeField
  | ItemTraverseNodeValueItem;

interface ItemTraverseNodeError {
  path: ItemValuePath;
  type: ItemTraverseNodeType.error;
  message: string;
}

interface ItemTraverseNodeField {
  path: ItemValuePath;
  type: ItemTraverseNodeType.field;
  fieldSpec: FieldSpecification;
  value: unknown;
}

interface ItemTraverseNodeValueItem {
  path: ItemValuePath;
  type: ItemTraverseNodeType.valueItem;
  valueSpec: AdminValueTypeSpecification;
  valueItem: ValueItem;
}

export function* traverseItem(
  schema: AdminSchema,
  path: ItemValuePath,
  item: AdminEntity | ValueItem
): Generator<ItemTraverseNode> {
  let fieldSpecs;
  let fields;
  if (!isItemValueItem(item)) {
    const entitySpec = schema.getEntityTypeSpecification(item.info.type);
    if (!entitySpec) {
      const errorNode: ItemTraverseNodeError = {
        type: ItemTraverseNodeType.error,
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
      const errorNode: ItemTraverseNodeError = {
        type: ItemTraverseNodeType.error,
        path,
        message: `Couldn't find spec for value type ${item.type}`,
      };
      yield errorNode;
      return;
    }

    const valueItemNode: ItemTraverseNodeValueItem = {
      type: ItemTraverseNodeType.valueItem,
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
    const fieldNode: ItemTraverseNodeField = {
      type: ItemTraverseNodeType.field,
      path: fieldPath,
      fieldSpec,
      value: fieldValue,
    };
    yield fieldNode;
    if (fieldSpec.list) {
      if (fieldValue === null || fieldValue === undefined) {
        continue;
      }
      if (!Array.isArray(fieldValue)) {
        const errorNode: ItemTraverseNodeError = {
          type: ItemTraverseNodeType.error,
          path,
          message: `Expected list got ${typeof fieldValue}`,
        };
        yield errorNode;
        continue;
      }

      for (let i = 0; i < fieldValue.length; i += 1) {
        const fieldItemPath = [...fieldPath, i];
        const fieldItem = fieldValue[i];
        yield* traverseItemFieldValue(schema, fieldItemPath, fieldSpec, fieldItem);
      }
    } else {
      yield* traverseItemFieldValue(schema, fieldPath, fieldSpec, fieldValue);
    }
  }
}

function* traverseItemFieldValue(
  schema: AdminSchema,
  path: ItemValuePath,
  fieldSpec: FieldSpecification,
  itemValue: unknown
) {
  if (isValueTypeItemField(fieldSpec, itemValue) && itemValue) {
    yield* traverseItem(schema, path, itemValue);
  } else if (isRichTextItemField(fieldSpec, itemValue) && itemValue) {
    for (let i = 0; i < itemValue.blocks.length; i += 1) {
      const blockPath = [...path, 'blocks', i];
      const block = itemValue.blocks[i];
      if (block.type === RichTextBlockType.valueItem && block.data) {
        yield* traverseItem(schema, [...blockPath, 'data'], block.data as ValueItem);
      }
    }
  }
}
