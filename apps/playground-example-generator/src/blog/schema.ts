import type { AdminSchemaSpecificationUpdate } from '@jonasb/datadata-core';
import { FieldType } from '@jonasb/datadata-core';

export const SCHEMA: AdminSchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'BlogPost',
      authKeyPattern: 'none',
      fields: [
        { name: 'title', type: FieldType.String, required: true, isName: true },
        { name: 'heroImage', type: FieldType.ValueType, required: true, valueTypes: ['Image'] },
        { name: 'description', type: FieldType.RichText, multiline: true, required: true },
        { name: 'body', type: FieldType.RichText, required: true },
        {
          name: 'authors',
          type: FieldType.EntityType,
          list: true,
          required: true,
          entityTypes: ['Person'],
        },
        { name: 'tags', type: FieldType.String, list: true },
      ],
    },
    {
      name: 'Person',
      authKeyPattern: 'none',
      fields: [{ name: 'title', type: FieldType.String, required: true, isName: true }],
    },
  ],
  valueTypes: [
    {
      name: 'Image',
      fields: [{ name: 'publicId', type: FieldType.String, required: true }],
    },
  ],
  patterns: [
    {
      name: 'none',
      pattern: '^none$',
    },
  ],
};
