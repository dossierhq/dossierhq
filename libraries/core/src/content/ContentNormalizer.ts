import { type ErrorType, type Result } from '../ErrorResult.js';
import { type EntityLike, type ValueItem } from '../Types.js';
import type { AdminSchema } from '../schema/AdminSchema.js';
import type { PublishedSchema } from '../schema/PublishedSchema.js';
import type { ContentValuePath } from './ContentPath.js';
import {
  IDENTITY_TRANSFORMER,
  transformContentField,
  transformEntityFields,
  transformValueItem,
  type ContentTransformerEntityFieldsOptions,
  type ContentTransformerOptions,
} from './ContentTransformer.js';

export type ContentNormalizerOptions = ContentTransformerOptions;
export type ContentNormalizerEntityFieldsOptions = ContentTransformerEntityFieldsOptions;

export function normalizeEntityFields<TEntity extends EntityLike<string, object>>(
  schema: AdminSchema | PublishedSchema,
  path: ContentValuePath,
  entity: Readonly<TEntity>,
  options?: ContentNormalizerEntityFieldsOptions,
): Result<TEntity['fields'], typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  return transformEntityFields(schema, [...path, 'fields'], entity, IDENTITY_TRANSFORMER, options);
}

export function normalizeValueItem<TValueItem extends ValueItem<string, object>>(
  schema: AdminSchema | PublishedSchema,
  path: ContentValuePath,
  valueItem: Readonly<TValueItem>,
  options?: ContentNormalizerOptions,
): Result<TValueItem, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  return transformValueItem(schema, path, valueItem, IDENTITY_TRANSFORMER, options);
}

export function normalizeContentField<TSchema extends AdminSchema | PublishedSchema>(
  schema: TSchema,
  path: ContentValuePath,
  fieldSpec: TSchema['spec']['entityTypes' | 'valueTypes'][number]['fields'][number],
  value: unknown,
  options?: ContentNormalizerOptions,
): Result<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  return transformContentField(schema, path, fieldSpec, value, IDENTITY_TRANSFORMER, options);
}
