import type { AdminSchemaSpecificationUpdate } from '@dossierhq/core';
import { FieldType, RichTextNodeType } from '@dossierhq/core';

export const SCHEMA: AdminSchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'BooleansEntity',
      fields: [
        { name: 'normal', type: FieldType.Boolean },
        { name: 'required', type: FieldType.Boolean, required: true },
      ],
    },
    {
      name: 'EntitiesEntity',
      fields: [
        { name: 'normal', type: FieldType.Entity },
        { name: 'required', type: FieldType.Entity, required: true },
        { name: 'list', type: FieldType.Entity, list: true },
        { name: 'stringsEntity', type: FieldType.Entity, entityTypes: ['StringsEntity'] },
        {
          name: 'stringsEntityList',
          type: FieldType.Entity,
          list: true,
          entityTypes: ['StringsEntity'],
        },
        {
          name: 'stringsAndLocationsEntity',
          type: FieldType.Entity,
          entityTypes: ['LocationsEntity', 'StringsEntity'],
        },
        {
          name: 'stringsAndLocationsEntityList',
          type: FieldType.Entity,
          list: true,
          entityTypes: ['LocationsEntity', 'StringsEntity'],
        },
      ],
    },
    {
      name: 'LocationsEntity',
      fields: [
        { name: 'normal', type: FieldType.Location },
        { name: 'required', type: FieldType.Location, required: true },
        { name: 'list', type: FieldType.Location, list: true },
        { name: 'requiredList', type: FieldType.Location, list: true, required: true },
      ],
    },
    {
      name: 'NumbersEntity',
      fields: [
        { name: 'normal', type: FieldType.Number },
        { name: 'required', type: FieldType.Number, required: true },
        { name: 'integer', type: FieldType.Number, integer: true },
        { name: 'list', type: FieldType.Number, list: true },
        { name: 'requiredList', type: FieldType.Number, list: true, required: true },
        {
          name: 'requiredIntegerList',
          type: FieldType.Number,
          list: true,
          required: true,
          integer: true,
        },
      ],
    },
    {
      name: 'RichTextsEntity',
      fields: [
        { name: 'normal', type: FieldType.RichText },
        { name: 'required', type: FieldType.RichText, required: true },
        {
          name: 'minimal',
          type: FieldType.RichText,
          richTextNodes: [
            RichTextNodeType.root,
            RichTextNodeType.paragraph,
            RichTextNodeType.text,
            RichTextNodeType.linebreak,
          ],
        },
        { name: 'list', type: FieldType.RichText, list: true },
        { name: 'adminOnly', type: FieldType.RichText, adminOnly: true },
        {
          name: 'stringsEntity',
          type: FieldType.RichText,
          richTextNodes: [
            RichTextNodeType.root,
            RichTextNodeType.paragraph,
            RichTextNodeType.text,
            RichTextNodeType.linebreak,
            RichTextNodeType.entity,
          ],
          entityTypes: ['StringsEntity'],
        },
        {
          name: 'numbersEntityLink',
          type: FieldType.RichText,
          richTextNodes: [
            RichTextNodeType.root,
            RichTextNodeType.paragraph,
            RichTextNodeType.text,
            RichTextNodeType.linebreak,
            RichTextNodeType.entityLink,
          ],
          linkEntityTypes: ['NumbersEntity'],
        },
        {
          name: 'nestedValueItem',
          type: FieldType.RichText,
          richTextNodes: [
            RichTextNodeType.root,
            RichTextNodeType.paragraph,
            RichTextNodeType.text,
            RichTextNodeType.linebreak,
            RichTextNodeType.valueItem,
          ],
          valueTypes: ['NestedValueItem'],
        },
      ],
    },
    {
      name: 'StringsEntity',
      nameField: 'title',
      fields: [
        { name: 'title', type: FieldType.String },
        { name: 'normal', type: FieldType.String },
        { name: 'required', type: FieldType.String, required: true },
        { name: 'matchPattern', type: FieldType.String, matchPattern: 'fooBarBaz' },
        { name: 'list', type: FieldType.String, list: true },
        { name: 'requiredList', type: FieldType.String, list: true, required: true },
        {
          name: 'requiredListMatchPattern',
          type: FieldType.String,
          list: true,
          required: true,
          matchPattern: 'fooBarBaz',
        },
      ],
    },
    {
      name: 'ValueItemsEntity',
      fields: [
        { name: 'normal', type: FieldType.ValueItem },
        { name: 'required', type: FieldType.ValueItem, required: true },
        { name: 'list', type: FieldType.ValueItem, list: true },
        { name: 'requiredList', type: FieldType.ValueItem, list: true, required: true },
        { name: 'adminOnly', type: FieldType.ValueItem, adminOnly: true },
        { name: 'cloudinaryImage', type: FieldType.ValueItem, valueTypes: ['CloudinaryImage'] },
      ],
    },
  ],
  valueTypes: [
    {
      name: 'CloudinaryImage',
      fields: [
        { name: 'publicId', type: FieldType.String, required: true },
        { name: 'width', type: FieldType.Number, integer: true, required: true },
        { name: 'height', type: FieldType.Number, integer: true, required: true },
        { name: 'alt', type: FieldType.String },
      ],
    },
    {
      name: 'NestedValueItem',
      fields: [
        { name: 'text', type: FieldType.String },
        { name: 'child', type: FieldType.ValueItem, valueTypes: ['NestedValueItem'] },
      ],
    },
    {
      name: 'StringsValueItem',
      fields: [
        { name: 'normal', type: FieldType.String },
        { name: 'required', type: FieldType.String, required: true },
        { name: 'matchPattern', type: FieldType.String, matchPattern: 'fooBarBaz' },
        { name: 'list', type: FieldType.String, list: true },
        { name: 'requiredList', type: FieldType.String, list: true, required: true },
        {
          name: 'requiredListMatchPattern',
          type: FieldType.String,
          list: true,
          required: true,
          matchPattern: 'fooBarBaz',
        },
      ],
    },
  ],
  patterns: [
    { name: 'none', pattern: '^none$' },
    { name: 'slug', pattern: '^[a-z0-9-]+$' },
    { name: 'fooBarBaz', pattern: '^(foo|bar|baz)$' },
  ],
  indexes: [{ name: 'slug', type: 'unique' }],
};
