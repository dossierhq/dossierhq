import {
  ok,
  type AdminEntity,
  type AdminSchemaWithMigrations,
  type ErrorType,
  type PublishedSchema,
  type Result,
  type AdminEntityTypeSpecification,
  type PublishedEntityTypeSpecification,
} from '@dossierhq/core';
import type { DatabaseEntityFieldsPayload } from '@dossierhq/database-adapter';
import { applySchemaMigrationsToFields } from './applySchemaMigrationsToFields.js';
import { legacyDecodeEntityFields } from './legacyDecodeEntityFields.js';

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

  const fields = legacyDecodeEntityFields(decodeSchema, entitySpec, migratedFieldValues);
  return ok(fields);
}
