import { ErrorType, ok } from '@dossierhq/core';
import { expectErrorResult } from '@dossierhq/core-vitest';
import type { Server, SessionContext } from '@dossierhq/server';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { createPostgresTestServerAndClient, randomUUID } from '../TestUtils.js';

//TODO consider moving this test back to server or even to core

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

describe('DossierClient createDossierClient()', () => {
  test('context provided as value', async () => {
    const client = server.createDossierClient(context);
    const result = await client.getEntity({ id: randomUUID() });
    expectErrorResult(result, ErrorType.NotFound, 'No such entity');
  });

  test('context provided as factory, factory is called for each request', async () => {
    const factory = vi.fn(() => Promise.resolve(ok({ context })));
    const client = server.createDossierClient(factory);

    const firstResult = await client.getEntity({ id: randomUUID() });
    expectErrorResult(firstResult, ErrorType.NotFound, 'No such entity');

    const secondResult = await client.getEntity({ id: randomUUID() });
    expectErrorResult(secondResult, ErrorType.NotFound, 'No such entity');

    expect(factory.mock.calls).toMatchInlineSnapshot(`
      [
        [],
        [],
      ]
    `);
  });
});
