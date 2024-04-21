import { FieldType, type SchemaSpecificationUpdate } from '@dossierhq/core';

export const schemaSpecification: SchemaSpecificationUpdate = {
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
