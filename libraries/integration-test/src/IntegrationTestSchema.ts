import {
  FieldType,
  REQUIRED_RICH_TEXT_NODES,
  type AdminSchemaSpecificationUpdate,
} from '@dossierhq/core';

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
      name: 'ChangeValidations',
      fields: [
        { name: 'required', type: FieldType.String, required: true },
        { name: 'matchPattern', type: FieldType.String, matchPattern: 'fooBarBaz' },
        { name: 'richText', type: FieldType.RichText, adminOnly: false },
        { name: 'valueItem', type: FieldType.ValueItem, adminOnly: false },
        { name: 'valueItemList', type: FieldType.ValueItem, list: true, adminOnly: false },
      ],
    },
    { name: 'MigrationEntity', fields: [] },
    {
      name: 'References',
      fields: [
        { name: 'any', type: FieldType.Entity },
        { name: 'anyList', type: FieldType.Entity, list: true },
        { name: 'anyAdminOnly', type: FieldType.Entity, adminOnly: true },
        { name: 'titleOnly', type: FieldType.Entity, entityTypes: ['TitleOnly'] },
      ],
    },
    {
      name: 'RichTexts',
      fields: [
        { name: 'richText', type: FieldType.RichText },
        { name: 'richTextList', type: FieldType.RichText, list: true },
        {
          name: 'richTextMinimal',
          type: FieldType.RichText,
          richTextNodes: REQUIRED_RICH_TEXT_NODES,
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
        { name: 'pattern', type: FieldType.String, matchPattern: 'fooBarBaz' },
        { name: 'patternList', type: FieldType.String, list: true, matchPattern: 'fooBarBaz' },
        {
          name: 'values',
          type: FieldType.String,
          values: [{ value: 'foo' }, { value: 'bar' }, { value: 'baz' }],
        },
        {
          name: 'valuesList',
          type: FieldType.String,
          list: true,
          values: [{ value: 'foo' }, { value: 'bar' }, { value: 'baz' }],
        },
        { name: 'unique', type: FieldType.String, index: 'stringsUnique' },
        {
          name: 'uniqueAdminOnly',
          type: FieldType.String,
          adminOnly: true,
          index: 'stringsUnique',
        },
        { name: 'uniqueGenericIndex', type: FieldType.String, index: 'genericUnique' },
      ],
    },
    {
      name: 'SubjectOnly',
      authKeyPattern: 'subject',
      fields: [{ name: 'message', type: FieldType.String, required: true }],
    },

    {
      name: 'TitleOnly',
      nameField: 'title',
      fields: [{ name: 'title', type: FieldType.String, required: true }],
    },
    {
      name: 'ValueItems',
      fields: [
        { name: 'any', type: FieldType.ValueItem },
        { name: 'anyAdminOnly', type: FieldType.ValueItem, adminOnly: true },
      ],
    },
  ],
  valueTypes: [
    { name: 'AdminOnlyValue', adminOnly: true, fields: [] },
    {
      name: 'ChangeValidationsValueItem',
      adminOnly: false,
      fields: [{ name: 'matchPattern', type: FieldType.String, matchPattern: 'fooBarBaz' }],
    },
    {
      name: 'LocationsValue',
      fields: [
        { name: 'location', type: FieldType.Location },
        { name: 'locationAdminOnly', type: FieldType.Location, adminOnly: true },
      ],
    },
    { name: 'MigrationValueItem', fields: [] },
    { name: 'ReferencesValue', fields: [{ name: 'reference', type: FieldType.Entity }] },
  ],
  patterns: [
    { name: 'subject', pattern: '^subject$' },
    { name: 'fooBarBaz', pattern: '^(foo|bar|baz)$' },
  ],
  indexes: [
    { name: 'genericUnique', type: 'unique' },
    { name: 'stringsUnique', type: 'unique' },
  ],
};

export const ChangeValidationsWithoutValidationsUpdate: AdminSchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'ChangeValidations',
      fields: [
        { name: 'required', type: FieldType.String, required: false },
        { name: 'matchPattern', type: FieldType.String, matchPattern: null },
        { name: 'richText', type: FieldType.RichText, adminOnly: true },
        { name: 'valueItem', type: FieldType.ValueItem, adminOnly: true },
        { name: 'valueItemList', type: FieldType.ValueItem, list: true, adminOnly: true },
      ],
    },
  ],
};

export const ChangeValidationsValueItemWithoutValidationsUpdate: AdminSchemaSpecificationUpdate = {
  valueTypes: [
    {
      name: 'ChangeValidationsValueItem',
      fields: [{ name: 'matchPattern', type: FieldType.String, matchPattern: null }],
    },
  ],
};
