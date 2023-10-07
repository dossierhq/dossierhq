import type { Component, EntityLike, RichTextNode } from '../Types.js';
import type { AdminSchema } from '../schema/AdminSchema.js';
import type { PublishedSchema } from '../schema/PublishedSchema.js';
import type {
  AdminComponentTypeSpecification,
  AdminEntityTypeSpecification,
  PublishedComponentTypeSpecification,
  PublishedEntityTypeSpecification,
} from '../schema/SchemaSpecification.js';
import type { ContentValuePath } from './ContentPath.js';
import {
  isComponentItemField,
  isRichTextElementNode,
  isRichTextItemField,
  isRichTextValueItemNode,
} from './ContentTypeUtils.js';
import {
  checkFieldItemTraversable,
  checkFieldTraversable,
  checkRichTextNodeTraversable,
} from './ContentUtils.js';

export const ContentTraverseNodeType = {
  component: 'component',
  entity: 'entity',
  error: 'error',
  field: 'field',
  fieldItem: 'fieldItem',
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
  | ContentTraverseNodeComponent<TSchema>
  | ContentTraverseNodeEntity<TSchema>
  | ContentTraverseNodeErrorGeneric
  | ContentTraverseNodeErrorMissingTypeSpec
  | ContentTraverseNodeField<TSchema>
  | ContentTraverseNodeFieldItem<TSchema>
  | ContentTraverseNodeRichTextNode<TSchema>;

interface ContentTraverseNodeEntity<TSchema extends AdminSchema | PublishedSchema> {
  path: ContentValuePath;
  type: 'entity';
  entitySpec: TSchema['spec']['entityTypes'][number];
  entity: EntityLike<string, object>;
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
  kind: 'entity' | 'component';
}

interface ContentTraverseNodeField<TSchema extends AdminSchema | PublishedSchema> {
  path: ContentValuePath;
  type: 'field';
  fieldSpec: TSchema['spec']['entityTypes' | 'componentTypes'][number]['fields'][number];
  value: unknown;
}

interface ContentTraverseNodeFieldItem<TSchema extends AdminSchema | PublishedSchema> {
  path: ContentValuePath;
  type: 'fieldItem';
  fieldSpec: TSchema['spec']['entityTypes' | 'componentTypes'][number]['fields'][number];
  value: unknown;
}

interface ContentTraverseNodeComponent<TSchema extends AdminSchema | PublishedSchema> {
  path: ContentValuePath;
  type: 'component';
  componentSpec: TSchema['spec']['componentTypes'][number];
  component: Component;
}

interface ContentTraverseNodeRichTextNode<TSchema extends AdminSchema | PublishedSchema> {
  path: ContentValuePath;
  type: 'richTextNode';
  fieldSpec: TSchema['spec']['entityTypes' | 'componentTypes'][number]['fields'][number];
  node: RichTextNode;
}

export function* traverseEntity<TSchema extends AdminSchema | PublishedSchema>(
  schema: TSchema,
  path: ContentValuePath,
  entity: EntityLike<string, object>,
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

  yield* traverseContentFields(
    schema,
    [...path, 'fields'],
    entitySpec,
    entity.fields as Record<string, unknown>,
  );
}

export function* traverseComponent<TSchema extends AdminSchema | PublishedSchema>(
  schema: TSchema,
  path: ContentValuePath,
  component: Component,
): Generator<ContentTraverseNode<TSchema>> {
  if (!component.type) {
    const errorNode: ContentTraverseNodeErrorGeneric = {
      type: ContentTraverseNodeType.error,
      path: [...path, 'type'],
      errorType: ContentTraverseNodeErrorType.generic,
      message: 'Missing a Component type',
    };
    yield errorNode;
    return;
  }
  const componentSpec = schema.getComponentTypeSpecification(component.type);
  if (!componentSpec) {
    const errorNode: ContentTraverseNodeErrorMissingTypeSpec = {
      type: ContentTraverseNodeType.error,
      path,
      errorType: ContentTraverseNodeErrorType.missingTypeSpec,
      message: `Couldn’t find spec for component ${component.type}`,
      typeName: component.type,
      kind: 'component',
    };
    yield errorNode;
    return;
  }

  const componentNode: ContentTraverseNodeComponent<TSchema> = {
    type: ContentTraverseNodeType.component,
    path,
    componentSpec,
    component,
  };
  yield componentNode;

  yield* traverseContentFields(schema, path, componentSpec, component);
}

function* traverseContentFields<TSchema extends AdminSchema | PublishedSchema>(
  schema: TSchema,
  path: ContentValuePath,
  typeSpec:
    | AdminEntityTypeSpecification
    | AdminComponentTypeSpecification
    | PublishedEntityTypeSpecification
    | PublishedComponentTypeSpecification,
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
  fieldSpec: TSchema['spec']['entityTypes' | 'componentTypes'][number]['fields'][number],
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
  fieldSpec: TSchema['spec']['entityTypes' | 'componentTypes'][number]['fields'][number],
  itemValue: unknown,
): Generator<ContentTraverseNode<TSchema>> {
  const traversableError = checkFieldItemTraversable(fieldSpec, itemValue);
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

  if (isComponentItemField(fieldSpec, itemValue) && itemValue) {
    yield* traverseComponent(schema, path, itemValue);
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
  fieldSpec: TSchema['spec']['entityTypes' | 'componentTypes'][number]['fields'][number],
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
    yield* traverseComponent(schema, [...path, 'data'], node.data);
  }
  if (isRichTextElementNode(node)) {
    for (let i = 0; i < node.children.length; i += 1) {
      const childPath = [...path, i];
      const child = node.children[i];
      yield* traverseRichTextNode(schema, childPath, fieldSpec, child);
    }
  }
}
