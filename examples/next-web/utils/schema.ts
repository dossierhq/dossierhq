import { FieldType, type AdminSchemaSpecificationUpdate } from '@dossierhq/core';

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
          name: 'location',
          type: 'Location',
        },
        {
          name: 'category',
          type: 'Reference',
          entityTypes: ['Category'],
        },
        {
          name: 'categories',
          type: 'Reference',
          list: true,
          entityTypes: ['Category'],
        },
        {
          name: 'annotatedCategory',
          type: FieldType.Component,
          componentTypes: ['AnnotatedCategory'],
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
      nameField: 'title',
      fields: [
        {
          name: 'title',
          type: 'String',
        },
      ],
    },
  ],
  componentTypes: [
    {
      name: 'AnnotatedCategory',
      fields: [
        {
          name: 'annotation',
          type: 'String',
        },
        {
          name: 'category',
          type: 'Reference',
          entityTypes: ['Category'],
        },
      ],
    },
  ],
};
