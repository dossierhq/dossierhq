import type { AdminSchemaSpecificationUpdate } from '@dossierhq/core';

export const schemaSpecification: AdminSchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'BlogPost',
      fields: [
        {
          name: 'title',
          type: 'String',
          isName: true,
        },
        {
          name: 'summary',
          type: 'String',
        },
        {
          name: 'location',
          type: 'Location',
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
          name: 'body',
          type: 'RichText',
        },
      ],
    },
    {
      name: 'Category',
      fields: [
        {
          name: 'title',
          type: 'String',
          isName: true,
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
