import type { AdminSchemaSpecificationUpdate } from '@dossierhq/core';

export const schemaSpecification: AdminSchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'Organization',
      fields: [
        {
          name: 'name',
          type: 'String',
          isName: true,
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
      fields: [
        {
          name: 'name',
          type: 'String',
          isName: true,
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
