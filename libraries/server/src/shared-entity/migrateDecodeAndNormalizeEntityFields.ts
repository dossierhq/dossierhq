import {
  isComponentItemField,
  isRichTextComponentNode,
  notOk,
  ok,
  transformEntityFields,
  type ContentTransformer,
  type ContentValuePath,
  type Entity,
  type EntityTypeSpecification,
  type ErrorType,
  type PublishedEntityTypeSpecification,
  type PublishedSchema,
  type Result,
  type SchemaWithMigrations,
} from '@dossierhq/core';
import type { DatabaseEntityFieldsPayload } from '@dossierhq/database-adapter';
import { applySchemaMigrationsToFields } from './applySchemaMigrationsToFields.js';
import { legacyDecodeEntityFields } from './legacyDecodeEntityFields.js';

export const ENCODE_VERSION_LEGACY = 0;
export const ENCODE_VERSION_AS_IS = 1; // version 0.4.2+: Used to encoding all content, old content is still encoded with version 0

export function migrateDecodeAndNormalizeAdminEntityFields(
  schema: SchemaWithMigrations,
  entitySpec: EntityTypeSpecification,
  path: ContentValuePath,
  entityFields: DatabaseEntityFieldsPayload,
): Result<Entity['fields'], typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  return migrateDecodeAndNormalizeEntityFields(schema, schema, entitySpec, path, entityFields);
}

export function migrateDecodeAndNormalizePublishedEntityFields(
  schema: SchemaWithMigrations,
  entitySpec: PublishedEntityTypeSpecification,
  path: ContentValuePath,
  entityFields: DatabaseEntityFieldsPayload,
): Result<Entity['fields'], typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  return migrateDecodeAndNormalizeEntityFields(
    schema,
    schema.toPublishedSchema(),
    entitySpec,
    path,
    entityFields,
  );
}

function migrateDecodeAndNormalizeEntityFields<
  TSchema extends SchemaWithMigrations | PublishedSchema,
>(
  schema: SchemaWithMigrations,
  decodeSchema: TSchema,
  entitySpec: TSchema['spec']['entityTypes'][number],
  path: ContentValuePath,
  entityFields: DatabaseEntityFieldsPayload,
): Result<Entity['fields'], typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const migratedFieldValuesResult = applySchemaMigrationsToFields(
    schema,
    entitySpec.name,
    entityFields,
  );
  if (migratedFieldValuesResult.isError()) return migratedFieldValuesResult;
  const migratedFieldValues = migratedFieldValuesResult.value;

  switch (entityFields.encodeVersion) {
    case ENCODE_VERSION_LEGACY:
      return ok(legacyDecodeEntityFields(decodeSchema, entitySpec, migratedFieldValues));
    case ENCODE_VERSION_AS_IS: {
      const normalizeResult = transformEntityFields(
        decodeSchema,
        path,
        { info: { type: entitySpec.name }, fields: migratedFieldValues },
        DECODE_TRANSFORMER,
      );
      if (normalizeResult.isError()) return normalizeResult;
      return ok(normalizeResult.value);
    }
    default:
      return notOk.Generic(`Unknown encode version ${entityFields.encodeVersion}`);
  }
}

const DECODE_TRANSFORMER: ContentTransformer<
  SchemaWithMigrations | PublishedSchema,
  typeof ErrorType.Generic
> = {
  transformField(_schema, _path, _fieldSpec, value: unknown) {
    return ok(value);
  },
  transformFieldItem(schema, _path, fieldSpec, value: unknown) {
    if (isComponentItemField(fieldSpec, value)) {
      const componentType = value?.type;
      if (componentType && !schema.getComponentTypeSpecification(componentType)) {
        // Could be that the component type was deleted or made adminOnly (when decoding published entities)
        return ok(null);
      }
    }
    return ok(value);
  },
  transformRichTextNode(schema, _path, _fieldSpec, node) {
    if (isRichTextComponentNode(node)) {
      const componentType = node.data.type;
      if (componentType && !schema.getComponentTypeSpecification(componentType)) {
        // Could be that the component type was deleted or made adminOnly (when decoding published entities)
        return ok(null);
      }
    }
    return ok(node);
  },
};
