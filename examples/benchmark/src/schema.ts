import { FieldType, type SchemaSpecificationUpdate } from '@dossierhq/core';

export const schemaSpecification: SchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'Organization',
      nameField: 'name',
      fields: [
        {
          name: 'name',
          type: FieldType.String,
        },
        {
          name: 'organizationNumber',
          type: FieldType.String,
        },
        {
          name: 'address',
          type: FieldType.Component,
          componentTypes: ['PostalAddress'],
        },
        {
          name: 'web',
          type: FieldType.String,
        },
      ],
    },
    {
      name: 'Person',
      nameField: 'name',
      fields: [
        {
          name: 'name',
          type: FieldType.String,
        },
        {
          name: 'address',
          type: FieldType.Component,
          componentTypes: ['PostalAddress'],
        },
        {
          name: 'organization',
          type: FieldType.Reference,
          entityTypes: ['Organization'],
        },
      ],
    },
  ],
  componentTypes: [
    {
      name: 'PostalAddress',
      fields: [
        { name: 'address1', type: FieldType.String, required: true },
        { name: 'address2', type: FieldType.String },
        { name: 'zip', type: FieldType.String, required: true },
        { name: 'city', type: FieldType.String, required: true },
      ],
    },
  ],
};
