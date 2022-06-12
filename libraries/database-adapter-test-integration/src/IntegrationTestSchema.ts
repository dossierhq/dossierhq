import { FieldType, type AdminSchemaSpecificationUpdate } from '@jonasb/datadata-core';

export const IntegrationTestSchema: AdminSchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'Locations',
      fields: [
        { name: 'location', type: FieldType.Location },
        { name: 'locationList', type: FieldType.Location, list: true },
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
        { name: 'titleOnly', type: FieldType.EntityType, entityTypes: ['TitleOnly'] },
      ],
    },
    {
      name: 'Strings',
      fields: [{ name: 'multiline', type: FieldType.String, multiline: true }],
    },
    {
      name: 'TitleOnly',
      fields: [{ name: 'title', type: FieldType.String, required: true, isName: true }],
    },
  ],
};
