import { CoreTestUtils, ErrorType } from '@jonasb/datadata-core';
import type { Server, SessionContext } from '.';
import { createServerAdminClient } from '.';
import { createTestServer, ensureSessionContext } from './ServerTestUtils';
import { insecureTestUuidv4 } from './test/AdditionalTestUtils';

const { expectErrorResult } = CoreTestUtils;

let server: Server;
let context: SessionContext;

beforeAll(async () => {
  server = await createTestServer();
  context = await ensureSessionContext(server, 'test', 'admin-client');
});
afterAll(async () => {
  await server.shutdown();
});

describe('AdminClient createServerAdminClient()', () => {
  test('context provided as value', async () => {
    const client = createServerAdminClient({ context });
    const result = await client.getEntity({ id: insecureTestUuidv4() });
    expectErrorResult(result, ErrorType.NotFound, 'No such entity');
  });

  test('context provided as factory, factory is called for each request', async () => {
    const factory = jest.fn(() => Promise.resolve(context));
    const client = createServerAdminClient({ context: factory });

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
