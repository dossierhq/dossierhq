import type { AdminSchemaSpecificationUpdate } from '@jonasb/datadata-core';
import { FieldType, RichTextNodeType } from '@jonasb/datadata-core';

export const schemaSpecification: AdminSchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'GlossaryTerm',
      authKeyPattern: 'none',
      fields: [
        {
          name: 'title',
          type: FieldType.String,
          isName: true,
          required: true,
        },
        {
          name: 'slug',
          type: FieldType.String,
          index: 'glossarySlug',
          matchPattern: 'slug',
          required: true,
        },
        {
          name: 'description',
          type: FieldType.RichText,
          required: true,
          richTextNodes: [
            RichTextNodeType.root,
            RichTextNodeType.paragraph,
            RichTextNodeType.text,
            RichTextNodeType.entityLink,
          ],
          linkEntityTypes: ['GlossaryTerm'],
        },
      ],
    },
  ],
  indexes: [{ name: 'glossarySlug', type: 'unique' }],
  patterns: [
    { name: 'none', pattern: '^none$' },
    { name: 'slug', pattern: '^[a-z0-9-]+$' },
  ],
};
