import type { ErrorType, Result } from '../ErrorResult.js';
import type { Component, EntityLike } from '../Types.js';
import type { AdminSchema } from '../schema/AdminSchema.js';
import type { PublishedSchema } from '../schema/PublishedSchema.js';
import type { ContentValuePath } from './ContentPath.js';
import {
  IDENTITY_TRANSFORMER,
  transformComponent,
  transformContentField,
  transformEntityFields,
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

export function normalizeComponent<TComponent extends Component<string, object>>(
  schema: AdminSchema | PublishedSchema,
  path: ContentValuePath,
  component: Readonly<TComponent>,
  options?: ContentNormalizerOptions,
): Result<TComponent, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  return transformComponent(schema, path, component, IDENTITY_TRANSFORMER, options);
}

export function normalizeContentField<TSchema extends AdminSchema | PublishedSchema>(
  schema: TSchema,
  path: ContentValuePath,
  fieldSpec: TSchema['spec']['entityTypes' | 'componentTypes'][number]['fields'][number],
  value: unknown,
  options?: ContentNormalizerOptions,
): Result<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  return transformContentField(schema, path, fieldSpec, value, IDENTITY_TRANSFORMER, options);
}
