import { notOk, ok, type ErrorType, type Result } from '../ErrorResult.js';
import type { EntityLike, RichTextNode, ValueItem } from '../Types.js';
import type { AdminSchema } from '../schema/AdminSchema.js';
import type { PublishedSchema } from '../schema/PublishedSchema.js';
import { contentValuePathToString, type ContentValuePath } from './ContentPath.js';
import {
  isRichTextItemField,
  isRichTextValueItemNode,
  isStringItemField,
  isValueItemItemField,
} from './ContentTypeUtils.js';
import { checkFieldItemTraversable, checkFieldTraversable } from './ContentUtils.js';
import { transformRichText } from './RichTextTransformer.js';

export const IDENTITY_TRANSFORMER: ContentTransformer<AdminSchema, typeof ErrorType.BadRequest> = {
  transformField(_path, _fieldSpec, value) {
    return ok(value);
  },
  transformFieldItem(_path, _fieldSpec, value) {
    return ok(value);
  },
  transformRichTextNode(_path, _fieldSpec, node) {
    return ok(node);
  },
};

export interface ContentTransformer<
  TSchema extends AdminSchema | PublishedSchema,
  TError extends ErrorType,
> {
  /**
   * @param path
   * @param fieldSpec
   * @param value
   * @returns `ok(null)` -> no value, `ok(undefined)` -> delete field, `ok(value)` -> new value
   */
  transformField: (
    path: ContentValuePath,
    fieldSpec: TSchema['spec']['entityTypes' | 'valueTypes'][number]['fields'][number],
    value: unknown,
  ) => Result<unknown, TError>;

  transformFieldItem: (
    path: ContentValuePath,
    fieldSpec: TSchema['spec']['entityTypes' | 'valueTypes'][number]['fields'][number],
    value: unknown,
  ) => Result<unknown, TError>;

  transformRichTextNode: (
    path: ContentValuePath,
    fieldSpec: TSchema['spec']['entityTypes' | 'valueTypes'][number]['fields'][number],
    node: Readonly<RichTextNode>,
  ) => Result<Readonly<RichTextNode | null>, TError>;
}

interface TransformEntityFieldsOptions {
  excludeOmittedEntityFields?: boolean;
}

export function transformEntityFields<
  TSchema extends AdminSchema | PublishedSchema,
  TEntity extends EntityLike<string, object>,
  TError extends ErrorType,
>(
  schema: TSchema,
  path: ContentValuePath,
  entity: Readonly<TEntity>,
  transformer: ContentTransformer<TSchema, TError>,
  options?: TransformEntityFieldsOptions,
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

export function transformValueItem<
  TSchema extends AdminSchema | PublishedSchema,
  TValueItem extends ValueItem<string, object>,
  TError extends ErrorType,
>(
  schema: TSchema,
  path: ContentValuePath,
  item: Readonly<TValueItem>,
  transformer: ContentTransformer<TSchema, TError>,
): Result<TValueItem, TError | typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  if (!item.type) {
    return notOk.BadRequest(`${contentValuePathToString(path)}: Value item has no type`);
  }
  const typeSpec = schema.getValueTypeSpecification(item.type);
  if (!typeSpec) {
    return notOk.BadRequest(
      `${contentValuePathToString(path)}: Couldn’t find spec for value type ${item.type}`,
    );
  }

  const transformResult = transformContentFields(
    schema,
    path,
    typeSpec,
    'value',
    item,
    transformer,
    undefined,
  );
  if (transformResult.isError()) return transformResult;
  if (transformResult.value === item) return ok(item);
  return ok({ ...transformResult.value, type: item.type } as TValueItem);
}

function transformContentFields<
  TSchema extends AdminSchema | PublishedSchema,
  TError extends ErrorType,
>(
  schema: TSchema,
  path: ContentValuePath,
  typeSpec: TSchema['spec']['entityTypes'][number] | TSchema['spec']['valueTypes'][number],
  kind: 'entity' | 'value',
  fields: Record<string, unknown>,
  transformer: ContentTransformer<TSchema, TError>,
  options: TransformEntityFieldsOptions | undefined,
): Result<
  Record<string, unknown>,
  TError | typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const unsupportedFieldNames = new Set(Object.keys(fields));
  if (kind === 'value') {
    unsupportedFieldNames.delete('type');
  }

  let changedFields = false;
  const newFields: Record<string, unknown> = {};
  for (const fieldSpec of typeSpec.fields) {
    const fieldPath = [...path, fieldSpec.name];
    const originalValue = fields[fieldSpec.name] as Readonly<unknown>;
    unsupportedFieldNames.delete(fieldSpec.name);

    if (kind === 'entity' && options?.excludeOmittedEntityFields && !(fieldSpec.name in fields)) {
      continue;
    }

    const transformResult = transformContentField(
      schema,
      fieldPath,
      fieldSpec,
      originalValue,
      transformer,
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

  if (unsupportedFieldNames.size > 0) {
    return notOk.BadRequest(
      `${contentValuePathToString(path)}: ${typeSpec.name} does not include the fields: ${[
        ...unsupportedFieldNames,
      ].join(', ')}`,
    );
  }

  if (!changedFields) {
    return ok(fields);
  }

  return ok(newFields);
}

export function transformContentField<
  TSchema extends AdminSchema | PublishedSchema,
  TError extends ErrorType,
>(
  schema: TSchema,
  path: ContentValuePath,
  fieldSpec: TSchema['spec']['entityTypes' | 'valueTypes'][number]['fields'][number],
  originalValue: unknown,
  transformer: ContentTransformer<TSchema, TError>,
): Result<unknown, TError | typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const traversableErrors = checkFieldTraversable(fieldSpec, originalValue);
  if (traversableErrors.length > 0) {
    return notOk.BadRequest(`${contentValuePathToString(path)}: ${traversableErrors.join(', ')}`);
  }

  const transformFieldResult = transformer.transformField(path, fieldSpec, originalValue);
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
    );
    if (transformFieldValueResult.isError()) return transformFieldValueResult;
    value = transformFieldValueResult.value;
  }

  return ok(value);
}

function transformContentFieldValue<
  TSchema extends AdminSchema | PublishedSchema,
  TError extends ErrorType,
>(
  schema: TSchema,
  path: ContentValuePath,
  fieldSpec: TSchema['spec']['entityTypes' | 'valueTypes'][number]['fields'][number],
  originalValue: Readonly<unknown> | null,
  transformer: ContentTransformer<TSchema, TError>,
): Result<unknown, TError | typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const traversableErrors = checkFieldItemTraversable(fieldSpec, originalValue);
  if (traversableErrors.length > 0) {
    return notOk.BadRequest(`${contentValuePathToString(path)}: ${traversableErrors.join(', ')}`);
  }

  const transformFieldItemResult = transformer.transformFieldItem(path, fieldSpec, originalValue);
  if (transformFieldItemResult.isError()) return transformFieldItemResult;
  const value = transformFieldItemResult.value;

  if (isValueItemItemField(fieldSpec, value) && value) {
    return transformValueItem(schema, path, value, transformer);
  } else if (isRichTextItemField(fieldSpec, value) && value) {
    return transformRichText(path, value, (path, node) => {
      const nodeResult = transformer.transformRichTextNode(path, fieldSpec, node);
      if (nodeResult.isError()) return nodeResult;
      const transformedNode = nodeResult.value;

      if (transformedNode && isRichTextValueItemNode(transformedNode)) {
        const valueItem = transformedNode.data;

        const valueItemResult = transformValueItem(schema, path, valueItem, transformer);
        if (valueItemResult.isError()) return valueItemResult;
        const transformedValueItem = valueItemResult.value;

        if (transformedValueItem !== valueItem) {
          return ok(
            transformedValueItem ? { ...transformedNode, data: transformedValueItem } : null,
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
