import { AdminSchema, FieldType } from '@jonasb/datadata-core';

export const adminTestSchema = new AdminSchema({
  entityTypes: [
    {
      name: 'TitleOnly',
      adminOnly: false,
      authKeyPattern: null,
      fields: [{ name: 'title', type: FieldType.String }],
    },
  ],
  valueTypes: [],
  patterns: [],
  indexes: [],
});

export const publishedTestSchema = adminTestSchema.toPublishedSchema();
