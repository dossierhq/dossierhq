import { type ErrorType, type Result } from '../ErrorResult.js';
import { type EntityLike, type ValueItem } from '../Types.js';
import type { AdminSchema } from '../schema/AdminSchema.js';
import type { AdminFieldSpecification } from '../schema/SchemaSpecification.js';
import type { ContentValuePath } from './ContentPath.js';
import {
  IDENTITY_TRANSFORMER,
  transformContentField,
  transformEntityFields,
  transformValueItem,
} from './ContentTransformer.js';

export function normalizeEntityFields<TEntity extends EntityLike<string, object>>(
  schema: AdminSchema,
  path: ContentValuePath,
  entity: Readonly<TEntity>,
  options?: { excludeOmittedEntityFields: boolean },
): Result<TEntity['fields'], typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  return transformEntityFields(schema, [...path, 'fields'], entity, IDENTITY_TRANSFORMER, options);
}

export function normalizeValueItem<TValueItem extends ValueItem<string, object>>(
  schema: AdminSchema,
  path: ContentValuePath,
  valueItem: Readonly<TValueItem>,
): Result<TValueItem, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  return transformValueItem(schema, path, valueItem, IDENTITY_TRANSFORMER);
}

export function normalizeContentField(
  schema: AdminSchema,
  path: ContentValuePath,
  fieldSpec: AdminFieldSpecification,
  value: unknown,
): Result<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  return transformContentField(schema, path, fieldSpec, value, IDENTITY_TRANSFORMER);
}
