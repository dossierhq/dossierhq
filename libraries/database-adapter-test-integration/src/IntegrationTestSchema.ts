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
      ],
    },
    {
      name: 'Strings',
      fields: [
        { name: 'multiline', type: FieldType.String, multiline: true },
        { name: 'stringAdminOnly', type: FieldType.String, adminOnly: true },
      ],
    },
    {
      name: 'TitleOnly',
      fields: [{ name: 'title', type: FieldType.String, required: true, isName: true }],
    },
  ],
  valueTypes: [
    { name: 'LocationsValue', fields: [{ name: 'location', type: FieldType.Location }] },
    { name: 'ReferencesValue', fields: [{ name: 'reference', type: FieldType.EntityType }] },
  ],
};
