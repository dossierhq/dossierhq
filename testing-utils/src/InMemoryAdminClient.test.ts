import { EntityPublishState, PublishingEventKind, Schema } from '@jonasb/datadata-core';
import { v4 as uuidv4 } from 'uuid';
import { InMemoryServer } from '.';
import { createInMemoryAdminClient } from './InMemoryAdminClient';
import { expectResultValue } from './TestUtils';

const schema = new Schema({ entityTypes: [{ name: 'Foo', fields: [] }], valueTypes: [] });

describe('getEntity()', () => {
  test('Fetch preloaded entity', async () => {
    const id = uuidv4();
    const server = new InMemoryServer(schema);
    server.loadEntities([
      {
        id,
        type: 'Foo',
        name: 'Foo',
        versions: [{ _version: 0 }],
        history: [{ version: 0, createdBy: 'user0', createdAt: '2021-03-03T20:51:12.671Z' }],
        publishedVersion: 0,
        publishEvents: [
          {
            kind: PublishingEventKind.Publish,
            version: 0,
            publishedBy: 'user0',
            publishedAt: '2021-03-03T20:51:12.671Z',
          },
        ],
      },
    ]);
    const context = server.createContext(uuidv4());
    const client = createInMemoryAdminClient({ context });
    const entityResult = await client.getEntity({ id });
    expectResultValue(entityResult, {
      id,
      info: { name: 'Foo', type: 'Foo', version: 0, publishingState: EntityPublishState.Published },
      fields: {},
    });
  });
});
