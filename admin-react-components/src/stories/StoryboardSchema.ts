import { FieldType, Schema } from '@datadata/core';

const schema = new Schema({
  entityTypes: [
    {
      name: 'Foo',
      fields: [
        { name: 'title', type: FieldType.String, isName: true },
        { name: 'tags', type: FieldType.String, list: true },
        { name: 'bar', type: FieldType.EntityType, entityTypes: ['Bar'] },
        { name: 'bars', type: FieldType.EntityType, entityTypes: ['Bar'], list: true },
      ],
    },
    { name: 'Bar', fields: [{ name: 'title', type: FieldType.String, isName: true }] },
  ],
  valueTypes: [],
});

export default schema;
