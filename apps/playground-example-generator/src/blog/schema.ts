import type { AdminSchemaSpecificationUpdate } from '@jonasb/datadata-core';
import { RichTextNodeType } from '@jonasb/datadata-core';
import { FieldType } from '@jonasb/datadata-core';

export const SCHEMA: AdminSchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'BlogPost',
      authKeyPattern: 'none',
      fields: [
        { name: 'title', type: FieldType.String, required: true, isName: true },
        {
          name: 'slug',
          type: FieldType.String,
          required: true,
          index: 'slug',
          matchPattern: 'slug',
        },
        {
          name: 'heroImage',
          type: FieldType.ValueItem,
          required: true,
          valueTypes: ['CloudinaryImage'],
        },
        {
          name: 'description',
          type: FieldType.RichText,
          required: true,
          richTextNodes: [RichTextNodeType.root, RichTextNodeType.paragraph, RichTextNodeType.text],
        },
        {
          name: 'body',
          type: FieldType.RichText,
          required: true,
          richTextNodes: [
            RichTextNodeType.root,
            RichTextNodeType.paragraph,
            RichTextNodeType.text,
            RichTextNodeType.entityLink,
            RichTextNodeType.valueItem,
          ],
          linkEntityTypes: ['BlogPost'],
          valueTypes: ['CloudinaryImage'],
        },
        {
          name: 'authors',
          type: FieldType.Entity,
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
      name: 'CloudinaryImage',
      fields: [{ name: 'publicId', type: FieldType.String, required: true }],
    },
  ],
  patterns: [
    {
      name: 'none',
      pattern: '^none$',
    },
    {
      name: 'slug',
      pattern: '^[a-z0-9-]+$',
    },
  ],
  indexes: [
    {
      name: 'slug',
      type: 'unique',
    },
  ],
};
