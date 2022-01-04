import { FieldType, type AdminSchemaSpecificationUpdate } from '@jonasb/datadata-core';

export const IntegrationTestSchemaSpecifciationUpdate: AdminSchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'References',
      fields: [
        { name: 'any', type: FieldType.EntityType },
        { name: 'titleOnly', type: FieldType.EntityType, entityTypes: ['TitleOnly'] },
      ],
    },
    {
      name: 'TitleOnly',
      fields: [{ name: 'title', type: FieldType.String, required: true, isName: true }],
    },
  ],
};
