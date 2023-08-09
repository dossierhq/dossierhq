import { AdminSchemaWithMigrations, FieldType } from '@dossierhq/core';

export const adminTestSchema = AdminSchemaWithMigrations.createAndValidate({
  entityTypes: [
    { name: 'EntitiesEntity', fields: [{ name: 'normal', type: FieldType.Entity }] },
    { name: 'TitleOnly', fields: [{ name: 'title', type: FieldType.String }] },
    {
      name: 'ValueItemsEntity',
      fields: [
        { name: 'normal', type: FieldType.ValueItem },
        { name: 'list', type: FieldType.ValueItem, list: true },
      ],
    },
  ],
  valueTypes: [
    {
      name: 'EntitiesValueItem',
      fields: [
        { name: 'normal', type: FieldType.Entity },
        { name: 'list', type: FieldType.Entity, list: true },
      ],
    },
    {
      name: 'LocationsValueItem',
      fields: [
        { name: 'normal', type: FieldType.Location },
        { name: 'list', type: FieldType.Location, list: true },
      ],
    },
  ],
}).valueOrThrow();

export const publishedTestSchema = adminTestSchema.toPublishedSchema();
