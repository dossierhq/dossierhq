import { Schema } from '@datadata/core';
import { expectOkResult } from '@datadata/core/src/CoreTestUtils';
import { v4 as uuidv4 } from 'uuid';
import { InMemoryAdmin, InMemoryServer } from '.';

const schema = new Schema({ entityTypes: [{ name: 'Foo', fields: [] }], valueTypes: [] });

describe('getEntity()', () => {
  test('Fetch preloaded entity', async () => {
    const id = uuidv4();
    const server = new InMemoryServer(schema);
    server.loadEntities([
      {
        versions: [{ id, _type: 'Foo', _name: 'Foo', _version: 0 }],
        history: [{ version: 0, createdBy: 'user0', createdAt: '2021-03-03T20:51:12.671Z' }],
      },
    ]);
    const context = server.createContext(uuidv4());
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
