import { AdminSchema, FieldType, PublishedSchema } from '@jonasb/datadata-core';

export const adminTestSchema = new AdminSchema({
  entityTypes: [
    { name: 'TitleOnly', adminOnly: false, fields: [{ name: 'title', type: FieldType.String }] },
  ],
  valueTypes: [],
});

export const publishedTestSchema = new PublishedSchema(adminTestSchema.toPublishedSchema());
