import {
  FieldType,
  REQUIRED_RICH_TEXT_NODES,
  type SchemaSpecificationUpdate,
} from '@dossierhq/core';

export const IntegrationTestSchema: SchemaSpecificationUpdate = {
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
      authKeyPattern: 'subjectOrDefault',
      fields: [{ name: 'message', type: FieldType.String, required: true }],
    },
    {
      name: 'ChangeValidations',
      adminOnly: false,
      fields: [
        { name: 'required', type: FieldType.String, required: true },
        { name: 'matchPattern', type: FieldType.String, matchPattern: 'fooBarBaz' },
        { name: 'richText', type: FieldType.RichText, adminOnly: false },
        { name: 'component', type: FieldType.Component, adminOnly: false },
        { name: 'componentList', type: FieldType.Component, list: true, adminOnly: false },
      ],
    },
    { name: 'MigrationEntity', fields: [] },
    {
      name: 'References',
      fields: [
        { name: 'any', type: FieldType.Reference },
        { name: 'anyList', type: FieldType.Reference, list: true },
        { name: 'anyAdminOnly', type: FieldType.Reference, adminOnly: true },
        { name: 'titleOnly', type: FieldType.Reference, entityTypes: ['TitleOnly'] },
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
          componentTypes: ['LocationsComponent'],
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
      name: 'SubjectOrDefaultAuthKey',
      authKeyPattern: 'subjectOrDefault',
      fields: [{ name: 'message', type: FieldType.String, required: true }],
    },
    {
      name: 'TitleOnly',
      nameField: 'title',
      fields: [{ name: 'title', type: FieldType.String, required: true }],
    },
    {
      name: 'Components',
      fields: [
        { name: 'any', type: FieldType.Component },
        { name: 'anyAdminOnly', type: FieldType.Component, adminOnly: true },
      ],
    },
  ],
  componentTypes: [
    { name: 'AdminOnlyComponent', adminOnly: true, fields: [] },
    {
      name: 'ChangeValidationsComponent',
      adminOnly: false,
      fields: [{ name: 'matchPattern', type: FieldType.String, matchPattern: 'fooBarBaz' }],
    },
    {
      name: 'LocationsComponent',
      fields: [
        { name: 'location', type: FieldType.Location },
        { name: 'locationAdminOnly', type: FieldType.Location, adminOnly: true },
      ],
    },
    { name: 'MigrationComponent', fields: [] },
    { name: 'ReferencesComponent', fields: [{ name: 'reference', type: FieldType.Reference }] },
  ],
  patterns: [
    { name: 'subject', pattern: '^subject$' },
    { name: 'subjectOrDefault', pattern: '^(?:subject|)$' },
    { name: 'fooBarBaz', pattern: '^(foo|bar|baz)$' },
  ],
  indexes: [
    { name: 'genericUnique', type: 'unique' },
    { name: 'stringsUnique', type: 'unique' },
  ],
};

export const ChangeValidationsWithoutValidationsUpdate: SchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'ChangeValidations',
      fields: [
        { name: 'required', type: FieldType.String, required: false },
        { name: 'matchPattern', type: FieldType.String, matchPattern: null },
        { name: 'richText', type: FieldType.RichText, adminOnly: true },
        { name: 'component', type: FieldType.Component, adminOnly: true },
        { name: 'componentList', type: FieldType.Component, list: true, adminOnly: true },
      ],
    },
  ],
};

export const ChangeValidationsComponentWithoutValidationsUpdate: SchemaSpecificationUpdate = {
  componentTypes: [
    {
      name: 'ChangeValidationsComponent',
      fields: [{ name: 'matchPattern', type: FieldType.String, matchPattern: null }],
    },
  ],
};
