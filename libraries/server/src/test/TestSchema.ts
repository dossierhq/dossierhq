import { AdminSchema } from '@jonasb/datadata-core';

export const adminTestSchema = new AdminSchema({
  entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
  valueTypes: [],
});
