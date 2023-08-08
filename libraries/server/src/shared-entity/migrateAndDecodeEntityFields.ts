import {
  isRichTextValueItemNode,
  isValueItemItemField,
  notOk,
  ok,
  transformEntityFields,
  type AdminEntity,
  type AdminEntityTypeSpecification,
  type AdminSchemaWithMigrations,
  type ContentTransformer,
  type ErrorType,
  type PublishedEntityTypeSpecification,
  type PublishedSchema,
  type Result,
} from '@dossierhq/core';
import type { DatabaseEntityFieldsPayload } from '@dossierhq/database-adapter';
import { applySchemaMigrationsToFields } from './applySchemaMigrationsToFields.js';
import { legacyDecodeEntityFields } from './legacyDecodeEntityFields.js';

export const ENCODE_VERSION_LEGACY = 0;
export const ENCODE_VERSION_AS_IS = 1;

//TODO add path
export function migrateAndDecodeAdminEntityFields(
  adminSchema: AdminSchemaWithMigrations,
  entitySpec: AdminEntityTypeSpecification,
  entityFields: DatabaseEntityFieldsPayload,
): Result<AdminEntity['fields'], typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  return migrateAndDecodeEntityFields(adminSchema, adminSchema, entitySpec, entityFields);
}

export function migrateAndDecodePublishedEntityFields(
  adminSchema: AdminSchemaWithMigrations,
  entitySpec: PublishedEntityTypeSpecification,
  entityFields: DatabaseEntityFieldsPayload,
): Result<AdminEntity['fields'], typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  return migrateAndDecodeEntityFields(
    adminSchema,
    adminSchema.toPublishedSchema(),
    entitySpec,
    entityFields,
  );
}

function migrateAndDecodeEntityFields<TSchema extends AdminSchemaWithMigrations | PublishedSchema>(
  adminSchema: AdminSchemaWithMigrations,
  decodeSchema: TSchema,
  entitySpec: TSchema['spec']['entityTypes'][number],
  entityFields: DatabaseEntityFieldsPayload,
): Result<AdminEntity['fields'], typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const migratedFieldValuesResult = applySchemaMigrationsToFields(
    adminSchema,
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
        ['entity', 'fields'],
        {
          info: { type: entitySpec.name },
          fields: migratedFieldValues,
        },
        createTransformer(decodeSchema),
      );
      if (normalizeResult.isError()) return normalizeResult;
      return ok(normalizeResult.value);
    }
    default:
      return notOk.Generic(`Unknown encode version ${entityFields.encodeVersion}`);
  }
}

function createTransformer(schema: AdminSchemaWithMigrations | PublishedSchema) {
  //TODO add schema to callback
  const DECODE_TRANSFORMER: ContentTransformer<
    AdminSchemaWithMigrations | PublishedSchema,
    typeof ErrorType.Generic
  > = {
    transformField(_path, _fieldSpec, value: unknown) {
      return ok(value);
    },
    transformFieldItem(_path, fieldSpec, value: unknown) {
      if (isValueItemItemField(fieldSpec, value)) {
        const valueType = value?.type;
        if (valueType && !schema.getValueTypeSpecification(valueType)) {
          // Could be that the value type was deleted or made adminOnly (when decoding published entities)
          return ok(null);
        }
      }
      return ok(value);
    },
    transformRichTextNode(_path, _fieldSpec, node) {
      if (isRichTextValueItemNode(node)) {
        const valueType = node.data.type;
        if (valueType && !schema.getValueTypeSpecification(valueType)) {
          // Could be that the value type was deleted or made adminOnly (when decoding published entities)
          return ok(null);
        }
      }
      return ok(node);
    },
  };
  return DECODE_TRANSFORMER;
}
