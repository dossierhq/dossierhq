import { ErrorType } from '@jonasb/datadata-core';
import { expectErrorResult } from '@jonasb/datadata-core-jest';
import type { Server, SessionContext } from '@jonasb/datadata-server';
import { createPostgresTestServerAndClient, insecureTestUuidv4 } from '../TestUtils';

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

describe('AdminClient createServerPublishedClient()', () => {
  test('context provided as value', async () => {
    const client = server.createPublishedClient(context);
    const result = await client.getEntity({ id: insecureTestUuidv4() });
    expectErrorResult(result, ErrorType.NotFound, 'No such entity');
  });
});
