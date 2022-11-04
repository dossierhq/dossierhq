import { AdminSchema, FieldType } from '@jonasb/datadata-core';

export const adminTestSchema = AdminSchema.createAndValidate({
  entityTypes: [{ name: 'TitleOnly', fields: [{ name: 'title', type: FieldType.String }] }],
}).valueOrThrow();

export const publishedTestSchema = adminTestSchema.toPublishedSchema();
