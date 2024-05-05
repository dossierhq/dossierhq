import { ErrorType } from '@dossierhq/core';
import { expectErrorResult } from '@dossierhq/core-vitest';
import type { Server, SessionContext } from '@dossierhq/server';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { createPostgresTestServerAndClient, randomUUID } from '../TestUtils.js';

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

describe('DossierClient createServerPublishedClient()', () => {
  test('context provided as value', async () => {
    const client = server.createPublishedDossierClient(context);
    const result = await client.getEntity({ id: randomUUID() });
    expectErrorResult(result, ErrorType.NotFound, 'No such entity');
  });
});
