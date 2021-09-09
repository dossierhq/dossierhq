import { CoreTestUtils, ErrorType, ok } from '@jonasb/datadata-core';
import type { Server, SessionContext } from '@jonasb/datadata-server';
import { createPostgresTestServerAndClient, insecureTestUuidv4 } from '../TestUtils';

//TODO consider moving this test back to server or even to core

const { expectErrorResult } = CoreTestUtils;

let server: Server;
let context: SessionContext;

beforeAll(async () => {
  const result = await createPostgresTestServerAndClient();
  if (result.isError()) throw result.toError();
  server = result.value.server;
  context = result.value.context;
});
afterAll(async () => {
  await server.shutdown();
});

describe('AdminClient createAdminClient()', () => {
  test('context provided as value', async () => {
    const client = server.createAdminClient(context);
    const result = await client.getEntity({ id: insecureTestUuidv4() });
    expectErrorResult(result, ErrorType.NotFound, 'No such entity');
  });

  test('context provided as factory, factory is called for each request', async () => {
    const factory = jest.fn(() => Promise.resolve(ok({ context })));
    const client = server.createAdminClient(factory);

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
