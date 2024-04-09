import { AdminSchemaWithMigrations, FieldType } from '@dossierhq/core';

export const adminTestSchema = AdminSchemaWithMigrations.createAndValidate({
  entityTypes: [
    { name: 'ReferencesEntity', fields: [{ name: 'normal', type: FieldType.Reference }] },
    { name: 'TitleOnly', fields: [{ name: 'title', type: FieldType.String }] },
    {
      name: 'ComponentsEntity',
      fields: [
        { name: 'normal', type: FieldType.Component },
        { name: 'list', type: FieldType.Component, list: true },
      ],
    },
  ],
  componentTypes: [
    {
      name: 'ReferencesComponent',
      fields: [
        { name: 'normal', type: FieldType.Reference },
        { name: 'list', type: FieldType.Reference, list: true },
      ],
    },
    {
      name: 'LocationsComponent',
      fields: [
        { name: 'normal', type: FieldType.Location },
        { name: 'list', type: FieldType.Location, list: true },
      ],
    },
  ],
}).valueOrThrow();

export const publishedTestSchema = adminTestSchema.toPublishedSchema();
