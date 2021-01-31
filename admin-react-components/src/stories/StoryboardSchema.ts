import { FieldType, Schema } from '@datadata/core';

const schema = new Schema({
  entityTypes: [
    {
      name: 'Foo',
      fields: [
        { name: 'title', type: FieldType.String, isName: true },
        { name: 'bar', type: FieldType.EntityType, entityTypes: ['Bar'] },
      ],
    },
    { name: 'Bar', fields: [{ name: 'title', type: FieldType.String, isName: true }] },
  ],
  valueTypes: [],
});

export default schema;
