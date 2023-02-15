import type { AdminSchemaSpecificationUpdate } from '@dossierhq/core';

export const schemaSpecification: AdminSchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'Organization',
      nameField: 'name',
      fields: [
        {
          name: 'name',
          type: 'String',
        },
        {
          name: 'organizationNumber',
          type: 'String',
        },
        {
          name: 'address',
          type: 'ValueItem',
          valueTypes: ['PostalAddress'],
        },
        {
          name: 'web',
          type: 'String',
        },
      ],
    },
    {
      name: 'Person',
      nameField: 'name',
      fields: [
        {
          name: 'name',
          type: 'String',
        },
        {
          name: 'address',
          type: 'ValueItem',
          valueTypes: ['PostalAddress'],
        },
        {
          name: 'organization',
          type: 'Entity',
          entityTypes: ['Organization'],
        },
      ],
    },
  ],
  valueTypes: [
    {
      name: 'PostalAddress',
      fields: [
        { name: 'address1', type: 'String', required: true },
        { name: 'address2', type: 'String' },
        { name: 'zip', type: 'String', required: true },
        { name: 'city', type: 'String', required: true },
      ],
    },
  ],
};
