import type { SchemaSpecificationUpdate } from '@dossierhq/core';
import { FieldType, REQUIRED_RICH_TEXT_NODES, RichTextNodeType } from '@dossierhq/core';

export const SCHEMA: SchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'BlogPost',
      nameField: 'title',
      fields: [
        { name: 'title', type: FieldType.String, required: true },
        {
          name: 'slug',
          type: FieldType.String,
          required: true,
          index: 'slug',
          matchPattern: 'slug',
        },
        {
          name: 'heroImage',
          type: FieldType.Component,
          componentTypes: ['CloudinaryImage'],
        },
        {
          name: 'description',
          type: FieldType.RichText,
          richTextNodes: REQUIRED_RICH_TEXT_NODES,
        },
        {
          name: 'body',
          type: FieldType.RichText,
          required: true,
          richTextNodes: [
            ...REQUIRED_RICH_TEXT_NODES,
            RichTextNodeType.entityLink,
            RichTextNodeType.component,
          ],
          linkEntityTypes: ['BlogPost'],
          componentTypes: ['CloudinaryImage'],
        },
        {
          name: 'authors',
          type: FieldType.Reference,
          list: true,
          entityTypes: ['Person'],
        },
        { name: 'tags', type: FieldType.String, list: true },
      ],
    },
    {
      name: 'Person',
      nameField: 'title',
      fields: [{ name: 'title', type: FieldType.String, required: true }],
    },
  ],
  componentTypes: [
    {
      name: 'CloudinaryImage',
      fields: [
        { name: 'publicId', type: FieldType.String, required: true },
        {
          name: 'width',
          type: FieldType.Number,
          integer: true,
          required: true,
        },
        {
          name: 'height',
          type: FieldType.Number,
          integer: true,
          required: true,
        },
        { name: 'alt', type: FieldType.String },
      ],
    },
  ],
  patterns: [
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
