import {
  isRichTextItemField,
  isRichTextValueItemNode,
  isValueItemItemField,
  notOk,
  ok,
  visitorPathToString,
  type AdminSchema,
  type EntityLike,
  type ErrorType,
  type ItemValuePath,
  type PublishedSchema,
  type Result,
  type RichTextNode,
  type ValueItem,
} from '@dossierhq/core';
import { transformRichText } from './RichTextTransformer.js';

interface ItemTransformer<TSchema extends AdminSchema | PublishedSchema, TError extends ErrorType> {
  /**
   * @param path
   * @param fieldSpec
   * @param value
   * @returns `ok(null)` -> no value, `ok(undefined)` -> delete field, `ok(value)` -> new value
   */
  transformField: (
    path: ItemValuePath,
    fieldSpec:
      | TSchema['spec']['entityTypes'][number]['fields'][number]
      | TSchema['spec']['valueTypes'][number]['fields'][number],
    value: Readonly<unknown> | null,
  ) => Result<Readonly<unknown> | null | undefined, TError>;

  transformFieldItem: (
    path: ItemValuePath,
    fieldSpec:
      | TSchema['spec']['entityTypes'][number]['fields'][number]
      | TSchema['spec']['valueTypes'][number]['fields'][number],
    value: Readonly<unknown> | null,
  ) => Result<Readonly<unknown> | null | undefined, TError>;

  transformRichTextNode: (
    path: ItemValuePath,
    fieldSpec:
      | TSchema['spec']['entityTypes'][number]['fields'][number]
      | TSchema['spec']['valueTypes'][number]['fields'][number],
    node: Readonly<RichTextNode>,
  ) => Result<Readonly<RichTextNode | null>, TError>;
}

// TODO should this be transformEntityFields()? see normalizeEntityFields()
export function transformEntity<
  TSchema extends AdminSchema | PublishedSchema,
  TEntity extends EntityLike,
  TError extends ErrorType,
>(
  schema: TSchema,
  path: ItemValuePath,
  entity: TEntity,
  mapper: ItemTransformer<TSchema, TError>,
): Result<TEntity, TError | typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const typeSpec = schema.getEntityTypeSpecification(entity.info.type);
  if (!typeSpec) {
    return notOk.BadRequest(
      `${visitorPathToString(path)}: Unknown entity type: ${entity.info.type}`,
    );
  }

  const transformResult = transformItemFields(schema, path, typeSpec, entity.fields, mapper);
  if (transformResult.isError()) return transformResult;
  if (transformResult.value === entity.fields) return ok(entity);
  return ok({ ...entity, fields: transformResult.value });
}

export function transformValueItem<
  TSchema extends AdminSchema | PublishedSchema,
  TError extends ErrorType,
>(
  schema: TSchema,
  path: ItemValuePath,
  item: ValueItem,
  mapper: ItemTransformer<TSchema, TError>,
): Result<ValueItem, TError | typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const typeSpec = schema.getValueTypeSpecification(item.type);
  if (!typeSpec) {
    return notOk.BadRequest(`${visitorPathToString(path)}: Unknown value type: ${item.type}`);
  }

  const transformResult = transformItemFields(schema, path, typeSpec, item, mapper);
  if (transformResult.isError()) return transformResult;
  if (transformResult.value === item) return ok(item);
  return ok({ ...transformResult.value, type: item.type });
}

function transformItemFields<
  TSchema extends AdminSchema | PublishedSchema,
  TError extends ErrorType,
>(
  schema: TSchema,
  path: ItemValuePath,
  typeSpec: TSchema['spec']['entityTypes'][number] | TSchema['spec']['valueTypes'][number],
  fields: Record<string, unknown>,
  mapper: ItemTransformer<TSchema, TError>,
): Result<
  Record<string, unknown>,
  TError | typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  let changedFields = false;
  const newFields: Record<string, unknown> = {};
  for (const fieldSpec of typeSpec.fields) {
    const fieldPath = [...path, fieldSpec.name];
    const originalValue = fields[fieldSpec.name] as Readonly<unknown>;
    const transformResult = transformItemField(schema, fieldPath, fieldSpec, originalValue, mapper);
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

function transformItemField<
  TSchema extends AdminSchema | PublishedSchema,
  TError extends ErrorType,
>(
  schema: TSchema,
  path: ItemValuePath,
  fieldSpec: TSchema['spec']['entityTypes'][number]['fields'][number],
  originalValue: Readonly<unknown> | null,
  mapper: ItemTransformer<TSchema, TError>,
): Result<unknown, TError | typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const transformFieldResult = mapper.transformField(path, fieldSpec, originalValue);
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

      const transformFieldValueResult = transformItemFieldValue(
        schema,
        fieldItemPath,
        fieldSpec,
        fieldItem,
        mapper,
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
    const transformFieldValueResult = transformItemFieldValue(
      schema,
      path,
      fieldSpec,
      value,
      mapper,
    );
    if (transformFieldValueResult.isError()) return transformFieldValueResult;
    value = transformFieldValueResult.value;
  }

  return ok(value);
}

function transformItemFieldValue<
  TSchema extends AdminSchema | PublishedSchema,
  TError extends ErrorType,
>(
  schema: TSchema,
  path: ItemValuePath,
  fieldSpec: TSchema['spec']['entityTypes'][number]['fields'][number],
  originalValue: Readonly<unknown> | null,
  mapper: ItemTransformer<TSchema, TError>,
): Result<
  Readonly<unknown> | undefined | null,
  TError | typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const transformFieldItemResult = mapper.transformFieldItem(path, fieldSpec, originalValue);
  if (transformFieldItemResult.isError()) return transformFieldItemResult;
  const value = transformFieldItemResult.value;

  if (isValueItemItemField(fieldSpec, value) && value) {
    return transformValueItem(schema, path, value, mapper);
  } else if (isRichTextItemField(fieldSpec, value) && value) {
    return transformRichText(path, value, (path, node) => {
      const nodeResult = mapper.transformRichTextNode(path, fieldSpec, node);
      if (nodeResult.isError()) return nodeResult;
      const transformedNode = nodeResult.value;

      if (transformedNode && isRichTextValueItemNode(transformedNode)) {
        const valueItem = transformedNode.data;

        const valueItemResult = transformValueItem(schema, path, valueItem, mapper);
        if (valueItemResult.isError()) return valueItemResult;
        const mappedValueItem = valueItemResult.value;

        if (mappedValueItem !== valueItem) {
          return ok(mappedValueItem ? { ...transformedNode, data: mappedValueItem } : null);
        }
      }
      return ok(transformedNode);
    });
  }

  return ok(value);
}
