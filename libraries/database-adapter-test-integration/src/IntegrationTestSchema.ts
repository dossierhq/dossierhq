import {
  FieldType,
  RichTextNodeType,
  type AdminSchemaSpecificationUpdate,
} from '@jonasb/datadata-core';

export const IntegrationTestSchema: AdminSchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'Locations',
      fields: [
        { name: 'location', type: FieldType.Location },
        { name: 'locationList', type: FieldType.Location, list: true },
        { name: 'locationAdminOnly', type: FieldType.Location, adminOnly: true },
      ],
    },
    {
      name: 'ReadOnly',
      fields: [{ name: 'message', type: FieldType.String, required: true }],
    },
    {
      name: 'References',
      fields: [
        { name: 'any', type: FieldType.EntityType },
        { name: 'anyList', type: FieldType.EntityType, list: true },
        { name: 'anyAdminOnly', type: FieldType.EntityType, adminOnly: true },
        { name: 'titleOnly', type: FieldType.EntityType, entityTypes: ['TitleOnly'] },
      ],
    },
    {
      name: 'RichTexts',
      fields: [
        { name: 'richText', type: FieldType.RichText },
        { name: 'richTextList', type: FieldType.RichText, list: true },
        {
          name: 'richTextOnlyParagraphAndText',
          type: FieldType.RichText,
          richTextNodes: [RichTextNodeType.root, RichTextNodeType.paragraph, RichTextNodeType.text],
        },
        {
          name: 'richTextLimitedTypes',
          type: FieldType.RichText,
          entityTypes: ['References'],
          linkEntityTypes: ['TitleOnly'],
          valueTypes: ['LocationsValue'],
        },
      ],
    },
    {
      name: 'Strings',
      fields: [
        { name: 'multiline', type: FieldType.String, multiline: true },
        { name: 'stringAdminOnly', type: FieldType.String, adminOnly: true },
        { name: 'pattern', type: FieldType.String, matchPattern: 'foo-bar-baz' },
        { name: 'patternList', type: FieldType.String, list: true, matchPattern: 'foo-bar-baz' },
        { name: 'unique', type: FieldType.String, index: 'strings-unique' },
      ],
    },
    {
      name: 'SubjectOnly',
      authKeyPattern: 'subject',
      fields: [{ name: 'message', type: FieldType.String, required: true }],
    },

    {
      name: 'TitleOnly',
      fields: [{ name: 'title', type: FieldType.String, required: true, isName: true }],
    },
    {
      name: 'ValueItems',
      fields: [
        { name: 'any', type: FieldType.ValueType },
        { name: 'anyAdminOnly', type: FieldType.ValueType, adminOnly: true },
      ],
    },
  ],
  valueTypes: [
    { name: 'AdminOnlyValue', adminOnly: true, fields: [] },
    {
      name: 'LocationsValue',
      fields: [
        { name: 'location', type: FieldType.Location },
        { name: 'locationAdminOnly', type: FieldType.Location, adminOnly: true },
      ],
    },
    { name: 'ReferencesValue', fields: [{ name: 'reference', type: FieldType.EntityType }] },
  ],
  patterns: [
    { name: 'subject', pattern: '^subject$' },
    { name: 'foo-bar-baz', pattern: '^(foo|bar|baz)$' },
  ],
  indexes: [{ name: 'strings-unique', type: 'unique' }],
};
