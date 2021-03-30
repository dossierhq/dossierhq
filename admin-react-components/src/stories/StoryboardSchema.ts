import { FieldType, RichTextBlockType, Schema } from '@datadata/core';

const schema = new Schema({
  entityTypes: [
    {
      name: 'Foo',
      fields: [
        { name: 'title', type: FieldType.String, isName: true },
        { name: 'tags', type: FieldType.String, list: true },
        { name: 'location', type: FieldType.Location },
        { name: 'locations', type: FieldType.Location, list: true },
        { name: 'bar', type: FieldType.EntityType, entityTypes: ['Bar'] },
        { name: 'bars', type: FieldType.EntityType, entityTypes: ['Bar'], list: true },
        { name: 'body', type: FieldType.RichText },
        { name: 'annotatedBar', type: FieldType.ValueType, valueTypes: ['AnnotatedBar'] },
        {
          name: 'annotatedBars',
          type: FieldType.ValueType,
          valueTypes: ['AnnotatedBar'],
          list: true,
        },
        { name: 'nested', type: FieldType.ValueType, valueTypes: ['NestedValueItem'] },
      ],
    },
    { name: 'Bar', fields: [{ name: 'title', type: FieldType.String, isName: true }] },
    {
      name: 'Baz',
      fields: [
        { name: 'body', type: FieldType.RichText },
        {
          name: 'bodyBar',
          type: FieldType.RichText,
          entityTypes: ['Bar'],
          richTextBlocks: [
            { type: RichTextBlockType.entity },
            { type: RichTextBlockType.paragraph },
          ],
        },
        {
          name: 'bodyNested',
          type: FieldType.RichText,
          valueTypes: ['NestedValueItem'],
          richTextBlocks: [
            { type: RichTextBlockType.valueItem },
            { type: RichTextBlockType.paragraph },
          ],
        },
      ],
    },
  ],
  valueTypes: [
    {
      name: 'AnnotatedBar',
      fields: [
        {
          name: 'annotation',
          type: FieldType.String,
        },
        {
          name: 'bar',
          type: FieldType.EntityType,
          entityTypes: ['Bar'],
        },
      ],
    },
    {
      name: 'NestedValueItem',
      fields: [
        { name: 'text', type: FieldType.String },
        { name: 'child', type: FieldType.ValueType, valueTypes: ['NestedValueItem'] },
      ],
    },
  ],
});

export default schema;
