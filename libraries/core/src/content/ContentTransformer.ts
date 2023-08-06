import { notOk, ok, type ErrorType, type Result } from '../ErrorResult.js';
import type { EntityLike, RichTextNode, ValueItem } from '../Types.js';
import type { AdminSchema } from '../schema/AdminSchema.js';
import type { PublishedSchema } from '../schema/PublishedSchema.js';
import { contentValuePathToString, type ContentValuePath } from './ContentPath.js';
import {
  isRichTextItemField,
  isRichTextValueItemNode,
  isValueItemItemField,
} from './ContentTypeUtils.js';
import { transformRichText } from './RichTextTransformer.js';

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
    value: Readonly<unknown> | null,
  ) => Result<Readonly<unknown> | null | undefined, TError>;

  transformFieldItem: (
    path: ContentValuePath,
    fieldSpec: TSchema['spec']['entityTypes' | 'valueTypes'][number]['fields'][number],
    value: Readonly<unknown> | null,
  ) => Result<Readonly<unknown> | null | undefined, TError>;

  transformRichTextNode: (
    path: ContentValuePath,
    fieldSpec: TSchema['spec']['entityTypes' | 'valueTypes'][number]['fields'][number],
    node: Readonly<RichTextNode>,
  ) => Result<Readonly<RichTextNode | null>, TError>;
}

export function transformEntityFields<
  TSchema extends AdminSchema | PublishedSchema,
  TEntity extends EntityLike,
  TError extends ErrorType,
>(
  schema: TSchema,
  path: ContentValuePath,
  entity: TEntity,
  transformer: ContentTransformer<TSchema, TError>,
): Result<TEntity['fields'], TError | typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const typeSpec = schema.getEntityTypeSpecification(entity.info.type);
  if (!typeSpec) {
    return notOk.BadRequest(
      `${contentValuePathToString(path)}: Unknown entity type: ${entity.info.type}`,
    );
  }

  const transformResult = transformContentFields(
    schema,
    path,
    typeSpec,
    entity.fields,
    transformer,
  );
  if (transformResult.isError()) return transformResult;
  if (transformResult.value === entity.fields) return ok(entity.fields);
  return ok(transformResult.value);
}

export function transformValueItem<
  TSchema extends AdminSchema | PublishedSchema,
  TError extends ErrorType,
>(
  schema: TSchema,
  path: ContentValuePath,
  item: ValueItem,
  transformer: ContentTransformer<TSchema, TError>,
): Result<ValueItem, TError | typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const typeSpec = schema.getValueTypeSpecification(item.type);
  if (!typeSpec) {
    return notOk.BadRequest(`${contentValuePathToString(path)}: Unknown value type: ${item.type}`);
  }

  const transformResult = transformContentFields(schema, path, typeSpec, item, transformer);
  if (transformResult.isError()) return transformResult;
  if (transformResult.value === item) return ok(item);
  return ok({ ...transformResult.value, type: item.type });
}

function transformContentFields<
  TSchema extends AdminSchema | PublishedSchema,
  TError extends ErrorType,
>(
  schema: TSchema,
  path: ContentValuePath,
  typeSpec: TSchema['spec']['entityTypes'][number] | TSchema['spec']['valueTypes'][number],
  fields: Record<string, unknown>,
  transformer: ContentTransformer<TSchema, TError>,
): Result<
  Record<string, unknown>,
  TError | typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  let changedFields = false;
  const newFields: Record<string, unknown> = {};
  for (const fieldSpec of typeSpec.fields) {
    const fieldPath = [...path, fieldSpec.name];
    const originalValue = fields[fieldSpec.name] as Readonly<unknown>;
    const transformResult = transformContentField(
      schema,
      fieldPath,
      fieldSpec,
      originalValue,
      transformer,
    );
    if (transformResult.isError()) return transformResult;

    if (transformResult.value !== originalValue) {
      changedFields = true;
    }

    // If undefined, delete the field.
    if (transformResult.value !== undefined) {
      newFields[fieldSpec.name] = transformResult.value;
    }
  }

  if (!changedFields) {
    return ok(fields);
  }

  return ok(newFields);
}

function transformContentField<
  TSchema extends AdminSchema | PublishedSchema,
  TError extends ErrorType,
>(
  schema: TSchema,
  path: ContentValuePath,
  fieldSpec: TSchema['spec']['entityTypes' | 'valueTypes'][number]['fields'][number],
  originalValue: Readonly<unknown> | null,
  transformer: ContentTransformer<TSchema, TError>,
): Result<unknown, TError | typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const transformFieldResult = transformer.transformField(path, fieldSpec, originalValue);
  if (transformFieldResult.isError()) return transformFieldResult;
  let value = transformFieldResult.value;

  if (value === null || value === undefined) {
    return ok(value);
  }

  if (fieldSpec.list) {
    if (value === null || value === undefined) {
      return ok(value);
    }
    if (!Array.isArray(value)) {
      return notOk.BadRequest(`Expected list got ${typeof value}`);
    }

    let changedItems = false;
    const newItems: unknown[] = [];
    for (let i = 0; i < value.length; i += 1) {
      const fieldItemPath = [...path, i];
      const fieldItem = value[i] as Readonly<unknown>;

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
      value = newItems.length > 0 ? newItems : null;
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
): Result<
  Readonly<unknown> | undefined | null,
  TError | typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
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
  }

  return ok(value);
}
