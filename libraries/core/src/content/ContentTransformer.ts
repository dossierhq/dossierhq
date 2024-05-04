import { notOk, ok, type ErrorType, type Result } from '../ErrorResult.js';
import type { PublishedSchema } from '../schema/PublishedSchema.js';
import type { Schema } from '../schema/Schema.js';
import type { Component, EntityLike, RichTextNode } from '../Types.js';
import { contentValuePathToString, type ContentValuePath } from './ContentPath.js';
import {
  isComponentItemField,
  isRichTextComponentNode,
  isRichTextItemField,
  isStringItemField,
} from './ContentTypeUtils.js';
import { checkFieldItemTraversable, checkFieldTraversable } from './ContentUtils.js';
import { transformRichText } from './RichTextTransformer.js';

export const IDENTITY_TRANSFORMER: ContentTransformer<
  Schema | PublishedSchema,
  typeof ErrorType.BadRequest
> = {
  transformField(_schema, _path, _fieldSpec, value) {
    return ok(value);
  },
  transformFieldItem(_schema, _path, _fieldSpec, value) {
    return ok(value);
  },
  transformRichTextNode(_schema, _path, _fieldSpec, node) {
    return ok(node);
  },
};

export interface ContentTransformer<
  TSchema extends Schema | PublishedSchema,
  TError extends ErrorType,
> {
  transformField: (
    schema: TSchema,
    path: ContentValuePath,
    fieldSpec: TSchema['spec']['entityTypes' | 'componentTypes'][number]['fields'][number],
    value: unknown,
  ) => Result<unknown, TError>;

  transformFieldItem: (
    schema: TSchema,
    path: ContentValuePath,
    fieldSpec: TSchema['spec']['entityTypes' | 'componentTypes'][number]['fields'][number],
    value: unknown,
  ) => Result<unknown, TError>;

  transformRichTextNode: (
    schema: TSchema,
    path: ContentValuePath,
    fieldSpec: TSchema['spec']['entityTypes' | 'componentTypes'][number]['fields'][number],
    node: Readonly<RichTextNode>,
  ) => Result<Readonly<RichTextNode | null>, TError>;
}

export interface ContentTransformerEntityFieldsOptions extends ContentTransformerOptions {
  excludeOmittedEntityFields?: boolean;
}

export interface ContentTransformerOptions {
  keepExtraFields?: boolean;
}

export function transformEntityFields<
  TSchema extends Schema | PublishedSchema,
  TEntity extends EntityLike<string, object>,
  TError extends ErrorType,
>(
  schema: TSchema,
  path: ContentValuePath,
  entity: Readonly<TEntity>,
  transformer: ContentTransformer<TSchema, TError>,
  options?: ContentTransformerEntityFieldsOptions,
): Result<TEntity['fields'], TError | typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const typeSpec = schema.getEntityTypeSpecification(entity.info.type);
  if (!typeSpec) {
    return notOk.BadRequest(
      `${contentValuePathToString(path)}: Couldn’t find spec for entity type ${entity.info.type}`,
    );
  }

  const transformResult = transformContentFields(
    schema,
    path,
    typeSpec,
    'entity',
    entity.fields as Record<string, unknown>,
    transformer,
    options,
  );
  if (transformResult.isError()) return transformResult;
  if (transformResult.value === entity.fields) return ok(entity.fields);
  return ok(transformResult.value);
}

export function transformComponent<
  TSchema extends Schema | PublishedSchema,
  TComponent extends Component<string, object>,
  TError extends ErrorType,
>(
  schema: TSchema,
  path: ContentValuePath,
  component: Readonly<TComponent>,
  transformer: ContentTransformer<TSchema, TError>,
  options?: ContentTransformerOptions,
): Result<TComponent, TError | typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  if (!component.type) {
    return notOk.BadRequest(
      `${contentValuePathToString([...path, 'type'])}: Missing a component type`,
    );
  }
  const typeSpec = schema.getComponentTypeSpecification(component.type);
  if (!typeSpec) {
    return notOk.BadRequest(
      `${contentValuePathToString(path)}: Couldn’t find spec for component type ${component.type}`,
    );
  }

  const transformResult = transformContentFields(
    schema,
    path,
    typeSpec,
    'component',
    component,
    transformer,
    options,
  );
  if (transformResult.isError()) return transformResult;
  if (transformResult.value === component) return ok(component);
  return ok({ ...transformResult.value, type: component.type } as TComponent);
}

function transformContentFields<TSchema extends Schema | PublishedSchema, TError extends ErrorType>(
  schema: TSchema,
  path: ContentValuePath,
  typeSpec: TSchema['spec']['entityTypes'][number] | TSchema['spec']['componentTypes'][number],
  kind: 'entity' | 'component',
  fields: Record<string, unknown>,
  transformer: ContentTransformer<TSchema, TError>,
  options: ContentTransformerEntityFieldsOptions | ContentTransformerOptions | undefined,
): Result<
  Record<string, unknown>,
  TError | typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const extraFieldNames = new Set(Object.keys(fields));
  if (kind === 'component') {
    extraFieldNames.delete('type');
  }

  const excludeOmittedEntityFields = !!(
    options &&
    'excludeOmittedEntityFields' in options &&
    options.excludeOmittedEntityFields
  );
  const keepExtraFields = !!options?.keepExtraFields;

  let changedFields = false;
  const newFields: Record<string, unknown> = {};
  for (const fieldSpec of typeSpec.fields) {
    const fieldPath = [...path, fieldSpec.name];
    const originalValue = fields[fieldSpec.name] as Readonly<unknown>;
    extraFieldNames.delete(fieldSpec.name);

    if (kind === 'entity' && excludeOmittedEntityFields && !(fieldSpec.name in fields)) {
      continue;
    }

    const transformResult = transformContentField(
      schema,
      fieldPath,
      fieldSpec,
      originalValue,
      transformer,
      options,
    );
    if (transformResult.isError()) return transformResult;
    let transformedValue = transformResult.value;
    if (transformedValue === undefined) {
      transformedValue = null;
    }

    if (transformedValue !== originalValue) {
      changedFields = true;
    }
    newFields[fieldSpec.name] = transformedValue;
  }

  if (extraFieldNames.size > 0) {
    if (keepExtraFields) {
      if (changedFields) {
        // Copy extra fields as is when we want to keep them
        for (const fieldName of extraFieldNames) {
          newFields[fieldName] = fields[fieldName];
        }
      }
    } else {
      // So that we only return the fields that we know about
      changedFields = true;
    }
  }

  if (!changedFields) {
    return ok(fields);
  }

  return ok(newFields);
}

export function transformContentField<
  TSchema extends Schema | PublishedSchema,
  TError extends ErrorType,
>(
  schema: TSchema,
  path: ContentValuePath,
  fieldSpec: TSchema['spec']['entityTypes' | 'componentTypes'][number]['fields'][number],
  originalValue: unknown,
  transformer: ContentTransformer<TSchema, TError>,
  options?: ContentTransformerOptions,
): Result<unknown, TError | typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const traversableError = checkFieldTraversable(fieldSpec, originalValue);
  if (traversableError) {
    return notOk.BadRequest(
      `${contentValuePathToString([...path, ...traversableError.path])}: ${
        traversableError.message
      }`,
    );
  }

  const transformFieldResult = transformer.transformField(schema, path, fieldSpec, originalValue);
  if (transformFieldResult.isError()) return transformFieldResult;
  let value = transformFieldResult.value;

  if (value === null || value === undefined) {
    return ok(null);
  }

  if (fieldSpec.list) {
    let changedItems = false;
    const newItems: unknown[] = [];
    for (let i = 0; i < (value as []).length; i += 1) {
      const fieldItemPath = [...path, i];
      const fieldItem = (value as Readonly<unknown>[])[i];

      const transformFieldValueResult = transformContentFieldValue(
        schema,
        fieldItemPath,
        fieldSpec,
        fieldItem,
        transformer,
        options,
      );
      if (transformFieldValueResult.isError()) return transformFieldValueResult;
      const newFieldItem = transformFieldValueResult.value;

      if (newFieldItem !== fieldItem) {
        changedItems = true;
      }
      if (newFieldItem !== null && newFieldItem !== undefined) {
        newItems.push(newFieldItem);
      }
    }
    if (changedItems) {
      value = newItems;
    }
    if (Array.isArray(value) && value.length === 0) {
      value = null;
    }
  } else {
    const transformFieldValueResult = transformContentFieldValue(
      schema,
      path,
      fieldSpec,
      value,
      transformer,
      options,
    );
    if (transformFieldValueResult.isError()) return transformFieldValueResult;
    value = transformFieldValueResult.value;
  }

  return ok(value);
}

function transformContentFieldValue<
  TSchema extends Schema | PublishedSchema,
  TError extends ErrorType,
>(
  schema: TSchema,
  path: ContentValuePath,
  fieldSpec: TSchema['spec']['entityTypes' | 'componentTypes'][number]['fields'][number],
  originalValue: Readonly<unknown> | null,
  transformer: ContentTransformer<TSchema, TError>,
  options: ContentTransformerOptions | undefined,
): Result<unknown, TError | typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const traversableError = checkFieldItemTraversable(fieldSpec, originalValue);
  if (traversableError) {
    return notOk.BadRequest(
      `${contentValuePathToString([...path, ...traversableError.path])}: ${
        traversableError.message
      }`,
    );
  }

  const transformFieldItemResult = transformer.transformFieldItem(
    schema,
    path,
    fieldSpec,
    originalValue,
  );
  if (transformFieldItemResult.isError()) return transformFieldItemResult;
  const value = transformFieldItemResult.value;

  if (isComponentItemField(fieldSpec, value) && value) {
    return transformComponent(schema, path, value, transformer, options);
  } else if (isRichTextItemField(fieldSpec, value) && value) {
    return transformRichText(path, value, (path, node) => {
      const nodeResult = transformer.transformRichTextNode(schema, path, fieldSpec, node);
      if (nodeResult.isError()) return nodeResult;
      const transformedNode = nodeResult.value;

      if (transformedNode && isRichTextComponentNode(transformedNode)) {
        const component = transformedNode.data;

        const componentResult = transformComponent(schema, path, component, transformer, options);
        if (componentResult.isError()) return componentResult;
        const transformedComponent = componentResult.value;

        if (transformedComponent !== component) {
          return ok(
            transformedComponent ? { ...transformedNode, data: transformedComponent } : null,
          );
        }
      }
      return ok(transformedNode);
    });
  } else if (isStringItemField(fieldSpec, value)) {
    //TODO support trimming of strings?
    if (!value) {
      return ok(null); // Empty string => null
    }
  }

  return ok(value);
}
