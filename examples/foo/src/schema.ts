import type { AdminSchemaSpecificationUpdate } from '@dossierhq/core';

export const schemaSpecification: AdminSchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'BlogPost',
      nameField: 'title',
      fields: [
        {
          name: 'title',
          type: 'String',
        },
        {
          name: 'summary',
          type: 'String',
        },
        {
          name: 'category',
          type: 'Entity',
          entityTypes: ['Category'],
        },
        {
          name: 'categories',
          type: 'Entity',
          list: true,
          entityTypes: ['Category'],
        },
        {
          name: 'annotatedCategory',
          type: 'ValueItem',
          valueTypes: ['AnnotatedCategory'],
        },
        {
          name: 'tags',
          type: 'String',
          list: true,
        },
        {
          name: 'location',
          type: 'Location',
        },
      ],
    },
    {
      name: 'Category',
      nameField: 'title',
      fields: [
        {
          name: 'title',
          type: 'String',
        },
      ],
    },
  ],
  valueTypes: [
    {
      name: 'AnnotatedCategory',
      fields: [
        {
          name: 'annotation',
          type: 'String',
        },
        {
          name: 'category',
          type: 'Entity',
          entityTypes: ['Category'],
        },
      ],
    },
  ],
};
