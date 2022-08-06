import { AdminSchema, FieldType } from '@jonasb/datadata-core';

export const adminTestSchema = new AdminSchema({
  entityTypes: [
    { name: 'TitleOnly', adminOnly: false, fields: [{ name: 'title', type: FieldType.String }] },
  ],
  valueTypes: [],
});

export const publishedTestSchema = adminTestSchema.toPublishedSchema();
