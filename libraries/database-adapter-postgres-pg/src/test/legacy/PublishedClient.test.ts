import { CoreTestUtils, ErrorType } from '@jonasb/datadata-core';
import type { Server, SessionContext } from '@jonasb/datadata-server';
import { createServerPublishedClient, ServerTestUtils } from '@jonasb/datadata-server';
import { createPostgresTestServer, insecureTestUuidv4 } from '../TestUtils';

const { expectErrorResult } = CoreTestUtils;

let server: Server;
let context: SessionContext;

beforeAll(async () => {
  server = await createPostgresTestServer();
  context = await ServerTestUtils.ensureSessionContext(server, 'test', 'admin-client');
});
afterAll(async () => {
  await server.shutdown();
});

describe('AdminClient createServerPublishedClient()', () => {
  test('context provided as value', async () => {
    const client = createServerPublishedClient({ context });
    const result = await client.getEntity({ id: insecureTestUuidv4() });
    expectErrorResult(result, ErrorType.NotFound, 'No such entity');
  });

  test('context provided as factory, factory is called for each request', async () => {
    const factory = jest.fn(() => Promise.resolve(context));
    const client = createServerPublishedClient({ context: factory });

    const firstResult = await client.getEntity({ id: insecureTestUuidv4() });
    expectErrorResult(firstResult, ErrorType.NotFound, 'No such entity');

    const secondResult = await client.getEntity({ id: insecureTestUuidv4() });
    expectErrorResult(secondResult, ErrorType.NotFound, 'No such entity');

    expect(factory.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [],
        Array [],
      ]
    `);
  });
});
