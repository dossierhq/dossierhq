import { FieldType, type AdminSchemaSpecificationUpdate } from '@jonasb/datadata-core';

export const IntegrationTestSchemaSpecifciationUpdate: AdminSchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'TitleOnly',
      fields: [{ name: 'title', type: FieldType.String, required: true, isName: true }],
    },
  ],
};
