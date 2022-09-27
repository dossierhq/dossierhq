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
          name: 'heroImage',
          type: FieldType.ValueType,
          required: true,
          valueTypes: ['CloudinaryImage'],
        },
        {
          name: 'description',
          type: FieldType.RichText,
          multiline: true,
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
      name: 'CloudinaryImage',
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
