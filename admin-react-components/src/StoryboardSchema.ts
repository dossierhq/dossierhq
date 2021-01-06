import { FieldType, Schema } from '@datadata/core';

const schema = new Schema({
  entityTypes: [{ name: 'Foo', fields: [{ name: 'title', type: FieldType.String, isName: true }] }],
  valueTypes: [],
});

export default schema;
