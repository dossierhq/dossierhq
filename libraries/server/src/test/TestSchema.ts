import { AdminSchemaWithMigrations, FieldType } from '@dossierhq/core';

export const adminTestSchema = AdminSchemaWithMigrations.createAndValidate({
  entityTypes: [{ name: 'TitleOnly', fields: [{ name: 'title', type: FieldType.String }] }],
}).valueOrThrow();

export const publishedTestSchema = adminTestSchema.toPublishedSchema();
