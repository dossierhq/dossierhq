import type { AdminSchemaSpecificationUpdate } from '@jonasb/datadata-core';
import { FieldType, RichTextNodeType } from '@jonasb/datadata-core';

export const SCHEMA: AdminSchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'PersonalNote',
      fields: [
        {
          name: 'note',
          type: FieldType.RichText,
          richTextNodes: [
            RichTextNodeType.root,
            RichTextNodeType.paragraph,
            RichTextNodeType.text,
            RichTextNodeType.entity,
          ],
          entityTypes: ['PlaceOfBusiness'],
        },
        {
          name: 'placeOfBusiness',
          type: FieldType.EntityType,
          entityTypes: ['PlaceOfBusiness'],
          required: true,
        },
      ],
    },
    {
      name: 'PlaceOfBusiness',
      fields: [
        { name: 'name', type: FieldType.String, isName: true, required: true },
        { name: 'address', type: FieldType.ValueType, valueTypes: ['Address'] },
        { name: 'slogan', type: FieldType.String, required: true },
        { name: 'description', type: FieldType.String, multiline: true, required: true },
      ],
    },
    {
      name: 'Review',
      fields: [
        { name: 'reviewer', type: FieldType.EntityType, entityTypes: ['Reviewer'], required: true },
        {
          name: 'placeOfBusiness',
          type: FieldType.EntityType,
          entityTypes: ['PlaceOfBusiness'],
          required: true,
        },
        { name: 'review', type: FieldType.String, required: true },
      ],
    },
    {
      name: 'Reviewer',
      fields: [{ name: 'name', type: FieldType.String, isName: true, required: true }],
    },
  ],
  valueTypes: [
    {
      name: 'Address',
      fields: [
        { name: 'location', type: FieldType.Location, required: true },
        { name: 'line1', type: FieldType.String, required: true },
        { name: 'line2', type: FieldType.String },
        { name: 'zip', type: FieldType.String, required: true },
        { name: 'city', type: FieldType.String, required: true },
      ],
    },
  ],
};
