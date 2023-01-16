import type { AdminSchemaSpecificationUpdate } from '@dossierhq/core';
import { FieldType, RichTextNodeType } from '@dossierhq/core';

export const SCHEMA: AdminSchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'PersonalNote',
      authKeyPattern: 'subject',
      fields: [
        {
          name: 'note',
          type: FieldType.RichText,
          richTextNodes: [
            RichTextNodeType.root,
            RichTextNodeType.paragraph,
            RichTextNodeType.text,
            RichTextNodeType.linebreak,
            RichTextNodeType.entity,
          ],
          entityTypes: ['PlaceOfBusiness'],
        },
        {
          name: 'placeOfBusiness',
          type: FieldType.Entity,
          entityTypes: ['PlaceOfBusiness'],
          required: true,
        },
      ],
    },
    {
      name: 'PlaceOfBusiness',
      authKeyPattern: 'none',
      fields: [
        { name: 'name', type: FieldType.String, isName: true, required: true },
        { name: 'address', type: FieldType.ValueItem, valueTypes: ['Address'] },
        { name: 'slogan', type: FieldType.String, required: true },
        { name: 'description', type: FieldType.String, multiline: true, required: true },
      ],
    },
    {
      name: 'Review',
      authKeyPattern: 'none',
      fields: [
        { name: 'reviewer', type: FieldType.Entity, entityTypes: ['Reviewer'], required: true },
        {
          name: 'placeOfBusiness',
          type: FieldType.Entity,
          entityTypes: ['PlaceOfBusiness'],
          required: true,
        },
        { name: 'review', type: FieldType.String, required: true },
      ],
    },
    {
      name: 'Reviewer',
      authKeyPattern: 'none',
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
  patterns: [
    {
      name: 'none',
      pattern: '^none$',
    },
    {
      name: 'subject',
      pattern: '^subject$',
    },
  ],
};
