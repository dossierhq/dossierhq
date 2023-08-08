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
import {
  isRichTextElementNode,
  isRichTextItemField,
  isRichTextValueItemNode,
  isValueItemItemField,
} from './ContentTypeUtils.js';
import {
  checkFieldItemTraversable as traversableErrors,
  checkFieldTraversable,
  checkRichTextNodeTraversable,
} from './ContentUtils.js';

export const ContentTraverseNodeType = {
  entity: 'entity',
  error: 'error',
  field: 'field',
  fieldItem: 'fieldItem',
  valueItem: 'valueItem',
  richTextNode: 'richTextNode',
} as const;
export type ContentTraverseNodeType =
  (typeof ContentTraverseNodeType)[keyof typeof ContentTraverseNodeType];

export const ContentTraverseNodeErrorType = {
  generic: 'generic',
  missingTypeSpec: 'missingTypeSpec',
} as const;
export type ContentTraverseNodeErrorType =
  (typeof ContentTraverseNodeErrorType)[keyof typeof ContentTraverseNodeErrorType];

export type ContentTraverseNode<TSchema extends AdminSchema | PublishedSchema> =
  | ContentTraverseNodeEntity<TSchema>
  | ContentTraverseNodeErrorGeneric
  | ContentTraverseNodeErrorMissingTypeSpec
  | ContentTraverseNodeField<TSchema>
  | ContentTraverseNodeFieldItem<TSchema>
  | ContentTraverseNodeValueItem<TSchema>
  | ContentTraverseNodeRichTextNode<TSchema>;

interface ContentTraverseNodeEntity<TSchema extends AdminSchema | PublishedSchema> {
  path: ContentValuePath;
  type: 'entity';
  entitySpec: TSchema['spec']['entityTypes'][number];
  entity: EntityLike;
}

interface ContentTraverseNodeErrorGeneric {
  path: ContentValuePath;
  type: 'error';
  errorType: 'generic';
  message: string;
}

interface ContentTraverseNodeErrorMissingTypeSpec {
  path: ContentValuePath;
  type: 'error';
  errorType: 'missingTypeSpec';
  message: string;
  typeName: string;
  kind: 'entity' | 'valueItem';
}

interface ContentTraverseNodeField<TSchema extends AdminSchema | PublishedSchema> {
  path: ContentValuePath;
  type: 'field';
  fieldSpec: TSchema['spec']['entityTypes' | 'valueTypes'][number]['fields'][number];
  value: unknown;
}

interface ContentTraverseNodeFieldItem<TSchema extends AdminSchema | PublishedSchema> {
  path: ContentValuePath;
  type: 'fieldItem';
  fieldSpec: TSchema['spec']['entityTypes' | 'valueTypes'][number]['fields'][number];
  value: unknown;
}

interface ContentTraverseNodeValueItem<TSchema extends AdminSchema | PublishedSchema> {
  path: ContentValuePath;
  type: 'valueItem';
  valueSpec: TSchema['spec']['valueTypes'][number];
  valueItem: ValueItem;
}

interface ContentTraverseNodeRichTextNode<TSchema extends AdminSchema | PublishedSchema> {
  path: ContentValuePath;
  type: 'richTextNode';
  fieldSpec: TSchema['spec']['entityTypes' | 'valueTypes'][number]['fields'][number];
  node: RichTextNode;
}

export function* traverseEntity<TSchema extends AdminSchema | PublishedSchema>(
  schema: TSchema,
  path: ContentValuePath,
  entity: EntityLike,
): Generator<ContentTraverseNode<TSchema>> {
  const entitySpec = schema.getEntityTypeSpecification(entity.info.type);
  if (!entitySpec) {
    const errorNode: ContentTraverseNodeErrorMissingTypeSpec = {
      type: ContentTraverseNodeType.error,
      path,
      errorType: ContentTraverseNodeErrorType.missingTypeSpec,
      message: `Couldn’t find spec for entity type ${entity.info.type}`,
      typeName: entity.info.type,
      kind: 'entity',
    };
    yield errorNode;
    return;
  }

  const entityNode: ContentTraverseNodeEntity<TSchema> = {
    type: ContentTraverseNodeType.entity,
    path,
    entitySpec,
    entity,
  };
  yield entityNode;

  yield* traverseContentFields(schema, [...path, 'fields'], entitySpec, entity.fields);
}

export function* traverseValueItem<TSchema extends AdminSchema | PublishedSchema>(
  schema: TSchema,
  path: ContentValuePath,
  item: ValueItem,
): Generator<ContentTraverseNode<TSchema>> {
  if (!item.type) {
    const errorNode: ContentTraverseNodeErrorGeneric = {
      type: ContentTraverseNodeType.error,
      path: [...path, 'type'],
      errorType: ContentTraverseNodeErrorType.generic,
      message: 'Missing a ValueItem type',
    };
    yield errorNode;
    return;
  }
  const valueSpec = schema.getValueTypeSpecification(item.type);
  if (!valueSpec) {
    const errorNode: ContentTraverseNodeErrorMissingTypeSpec = {
      type: ContentTraverseNodeType.error,
      path,
      errorType: ContentTraverseNodeErrorType.missingTypeSpec,
      message: `Couldn’t find spec for value type ${item.type}`,
      typeName: item.type,
      kind: 'valueItem',
    };
    yield errorNode;
    return;
  }

  const valueItemNode: ContentTraverseNodeValueItem<TSchema> = {
    type: ContentTraverseNodeType.valueItem,
    path,
    valueSpec,
    valueItem: item,
  };
  yield valueItemNode;

  yield* traverseContentFields(schema, path, valueSpec, item);
}

function* traverseContentFields<TSchema extends AdminSchema | PublishedSchema>(
  schema: TSchema,
  path: ContentValuePath,
  typeSpec:
    | AdminEntityTypeSpecification
    | AdminValueTypeSpecification
    | PublishedEntityTypeSpecification
    | PublishedValueTypeSpecification,
  fields: Record<string, unknown>,
): Generator<ContentTraverseNode<TSchema>> {
  for (const fieldSpec of typeSpec.fields) {
    const fieldPath = [...path, fieldSpec.name];
    const fieldValue = fields?.[fieldSpec.name];

    yield* traverseContentField(schema, fieldPath, fieldSpec, fieldValue);
  }
}

export function* traverseContentField<TSchema extends AdminSchema | PublishedSchema>(
  schema: TSchema,
  path: ContentValuePath,
  fieldSpec: TSchema['spec']['entityTypes' | 'valueTypes'][number]['fields'][number],
  value: unknown,
): Generator<ContentTraverseNode<TSchema>> {
  const traversableError = checkFieldTraversable(fieldSpec, value);
  if (traversableError) {
    const errorNode: ContentTraverseNodeErrorGeneric = {
      type: ContentTraverseNodeType.error,
      path: [...path, ...traversableError.path],
      errorType: ContentTraverseNodeErrorType.generic,
      message: traversableError.message,
    };
    yield errorNode;
    return;
  }

  const fieldNode: ContentTraverseNodeField<TSchema> = {
    type: ContentTraverseNodeType.field,
    path,
    fieldSpec,
    value,
  };
  yield fieldNode;

  if (fieldSpec.list) {
    if (value === null || value === undefined) {
      return;
    }
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i += 1) {
        const fieldItemPath = [...path, i];
        const fieldItem = value[i] as unknown;
        yield* traverseContentFieldValue(schema, fieldItemPath, fieldSpec, fieldItem);
      }
    }
  } else {
    yield* traverseContentFieldValue(schema, path, fieldSpec, value);
  }
}

function* traverseContentFieldValue<TSchema extends AdminSchema | PublishedSchema>(
  schema: TSchema,
  path: ContentValuePath,
  fieldSpec: TSchema['spec']['entityTypes' | 'valueTypes'][number]['fields'][number],
  itemValue: unknown,
): Generator<ContentTraverseNode<TSchema>> {
  const traversableError = traversableErrors(fieldSpec, itemValue);
  if (traversableError) {
    const errorNode: ContentTraverseNodeErrorGeneric = {
      type: ContentTraverseNodeType.error,
      path: [...path, ...traversableError.path],
      errorType: ContentTraverseNodeErrorType.generic,
      message: traversableError.message,
    };
    yield errorNode;
    return;
  }

  const fieldValueNode: ContentTraverseNodeFieldItem<TSchema> = {
    type: ContentTraverseNodeType.fieldItem,
    path,
    fieldSpec,
    value: itemValue,
  };
  yield fieldValueNode;

  if (isValueItemItemField(fieldSpec, itemValue) && itemValue) {
    yield* traverseValueItem(schema, path, itemValue);
  } else if (isRichTextItemField(fieldSpec, itemValue) && itemValue) {
    if (typeof itemValue !== 'object') {
      const errorNode: ContentTraverseNodeErrorGeneric = {
        type: ContentTraverseNodeType.error,
        path,
        errorType: ContentTraverseNodeErrorType.generic,
        message: `Expected object got ${typeof itemValue}`,
      };
      yield errorNode;
      return;
    }
    const root = itemValue.root;
    if (root === undefined) {
      const errorNode: ContentTraverseNodeErrorGeneric = {
        type: ContentTraverseNodeType.error,
        path,
        errorType: ContentTraverseNodeErrorType.generic,
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
  fieldSpec: TSchema['spec']['entityTypes' | 'valueTypes'][number]['fields'][number],
  node: RichTextNode,
): Generator<ContentTraverseNode<TSchema>> {
  const traversableError = checkRichTextNodeTraversable(node);
  if (traversableError) {
    const errorNode: ContentTraverseNodeErrorGeneric = {
      type: ContentTraverseNodeType.error,
      path: [...path, ...traversableError.path],
      errorType: ContentTraverseNodeErrorType.generic,
      message: traversableError.message,
    };
    yield errorNode;
    return;
  }

  const traverseNode: ContentTraverseNodeRichTextNode<TSchema> = {
    type: ContentTraverseNodeType.richTextNode,
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
