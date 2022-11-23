import type { AdminSchemaSpecificationUpdate } from '@jonasb/datadata-core';

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
