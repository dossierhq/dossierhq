import type { SchemaSpecificationUpdate } from '@dossierhq/core';
import { FieldType, REQUIRED_RICH_TEXT_NODES, RichTextNodeType } from '@dossierhq/core';

export const SCHEMA: SchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'PersonalNote',
      authKeyPattern: 'subject',
      fields: [
        {
          name: 'note',
          type: FieldType.RichText,
          richTextNodes: [...REQUIRED_RICH_TEXT_NODES, RichTextNodeType.entity],
          entityTypes: ['PlaceOfBusiness'],
        },
        {
          name: 'placeOfBusiness',
          type: FieldType.Reference,
          entityTypes: ['PlaceOfBusiness'],
          required: true,
        },
      ],
    },
    {
      name: 'PlaceOfBusiness',
      nameField: 'name',
      fields: [
        { name: 'name', type: FieldType.String, required: true },
        { name: 'address', type: FieldType.Component, componentTypes: ['Address'] },
        { name: 'slogan', type: FieldType.String, required: true },
        { name: 'description', type: FieldType.String, multiline: true, required: true },
      ],
    },
    {
      name: 'Review',
      fields: [
        { name: 'reviewer', type: FieldType.Reference, entityTypes: ['Reviewer'], required: true },
        {
          name: 'placeOfBusiness',
          type: FieldType.Reference,
          entityTypes: ['PlaceOfBusiness'],
          required: true,
        },
        { name: 'review', type: FieldType.String, required: true },
      ],
    },
    {
      name: 'Reviewer',
      nameField: 'name',
      fields: [{ name: 'name', type: FieldType.String, required: true }],
    },
  ],
  componentTypes: [
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
      name: 'subject',
      pattern: '^subject$',
    },
  ],
};
