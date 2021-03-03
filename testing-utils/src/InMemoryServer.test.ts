import { Schema } from '@datadata/core';
import { expectOkResult } from '@datadata/core/src/CoreTestUtils';
import { InMemoryAdmin, InMemoryServer } from './InMemoryServer';

const schema = new Schema({ entityTypes: [{ name: 'Foo', fields: [] }], valueTypes: [] });

describe('Admin getEntity()', () => {
  test('Fetch preloaded entity', async () => {
    const id = '4125132b-cbb1-4557-a1e1-693e24fce9ba';
    const server = new InMemoryServer(schema);
    server.loadEntities([
      {
        versions: [{ id, _type: 'Foo', _name: 'Foo', _version: 0 }],
        history: [{ version: 0, createdBy: 'user0', createdAt: '2021-03-03T20:51:12.671Z' }],
      },
    ]);
    const context = server.createContext('123');
    const entityResult = await InMemoryAdmin.getEntity(context, id, {});
    if (expectOkResult(entityResult)) {
      expect(entityResult.value).toEqual({
        item: {
          _name: 'Foo',
          _type: 'Foo',
          _version: 0,
          id,
        },
      });
    }
  });
});
