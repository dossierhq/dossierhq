import { ok } from '@dossierhq/core';
import { expectOkResult, expectResultValue } from '@dossierhq/core-vitest';
import type { GraphQLSchema } from 'graphql';
import { graphql } from 'graphql';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import type { SessionGraphQLContext } from '../GraphQLSchemaGenerator.js';
import { GraphQLSchemaGenerator } from '../GraphQLSchemaGenerator.js';
import type { TestServerWithSession } from './TestUtils.js';
import { setUpServerWithSession } from './TestUtils.js';

let server: TestServerWithSession;
let schema: GraphQLSchema;

beforeAll(async () => {
  server = await setUpServerWithSession(
    { entityTypes: [{ name: 'Placeholder', fields: [] }] },
    'data/advisory-lock.sqlite',
  );
  schema = new GraphQLSchemaGenerator({
    adminSchema: server.schema,
    publishedSchema: null,
  }).buildSchema();
});
afterAll(async () => {
  await server?.tearDown();
});

function createContext(): SessionGraphQLContext {
  return {
    adminClient: ok(server.adminClient),
    publishedClient: ok(server.publishedClient),
  };
}

const acquireAdvisoryLockQuery = `
mutation AcquireAdvisoryLock($name: String!, $leaseDuration: Int!) {
  acquireAdvisoryLock(name: $name, leaseDuration: $leaseDuration) {
    name
    handle
  }
}`;

const renewAdvisoryLockQuery = `
mutation RenewAdvisoryLock($name: String!, $handle: Int!) {
  renewAdvisoryLock(name: $name, handle: $handle) {
    name
    handle
  }
}`;

const releaseAdvisoryLockQuery = `
mutation ReleaseAdvisoryLock($name: String!, $handle: Int!) {
  releaseAdvisoryLock(name: $name, handle: $handle) {
    name
  }
}`;

describe('acquireAdvisoryLock()', () => {
  test('Acquire', async () => {
    const { adminClient } = server;

    const result = (await graphql({
      schema,
      source: acquireAdvisoryLockQuery,
      contextValue: createContext(),
      variableValues: { name: 'Acquire', leaseDuration: 500 },
    })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    expect(result.errors).toBeUndefined();
    expect(result.data).toBeDefined();
    const { name, handle } = result.data.acquireAdvisoryLock;
    expect(name).toEqual('Acquire');
    expect(typeof handle).toEqual('number');

    const releaseResult = await adminClient.releaseAdvisoryLock(name, handle);
    expectResultValue(releaseResult, { name });
  });

  test('Error: already locked', async () => {
    const { adminClient } = server;

    const acquireResult = await adminClient.acquireAdvisoryLock('Already locked', {
      leaseDuration: 500,
    });
    if (expectOkResult(acquireResult)) {
      const result = (await graphql({
        schema,
        source: acquireAdvisoryLockQuery,
        contextValue: createContext(),
        variableValues: { name: 'Already locked', leaseDuration: 123 },
      })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(result).toMatchInlineSnapshot(`
        {
          "data": {
            "acquireAdvisoryLock": null,
          },
          "errors": [
            [GraphQLError: Conflict: Lock with name 'Already locked' already exists],
          ],
        }
      `);
    }
  });
});

describe('renewAdvisoryLock()', () => {
  test('Renew', async () => {
    const { adminClient } = server;
    const acquireResult = await adminClient.acquireAdvisoryLock('Renew', { leaseDuration: 500 });
    if (expectOkResult(acquireResult)) {
      const { name, handle } = acquireResult.value;

      const result = (await graphql({
        schema,
        source: renewAdvisoryLockQuery,
        contextValue: createContext(),
        variableValues: { name, handle },
      })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(result.errors).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data.renewAdvisoryLock).toEqual({ name, handle });
    }
  });

  test('Error: renew invalid lock name', async () => {
    const result = (await graphql({
      schema,
      source: renewAdvisoryLockQuery,
      contextValue: createContext(),
      variableValues: { name: 'Invalid lock name', handle: 123 },
    })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "renewAdvisoryLock": null,
        },
        "errors": [
          [GraphQLError: NotFound: No such name or handle exists],
        ],
      }
    `);
  });
});

describe('releaseAdvisoryLock()', () => {
  test('Release', async () => {
    const { adminClient } = server;
    const acquireResult = await adminClient.acquireAdvisoryLock('Release', { leaseDuration: 500 });
    if (expectOkResult(acquireResult)) {
      const { name, handle } = acquireResult.value;

      const result = (await graphql({
        schema,
        source: releaseAdvisoryLockQuery,
        contextValue: createContext(),
        variableValues: { name, handle },
      })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(result.errors).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data.releaseAdvisoryLock).toEqual({ name });
    }
  });

  test('Error: release invalid lock name', async () => {
    const result = (await graphql({
      schema,
      source: releaseAdvisoryLockQuery,
      contextValue: createContext(),
      variableValues: { name: 'Invalid loch name', handle: 123 },
    })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "releaseAdvisoryLock": null,
        },
        "errors": [
          [GraphQLError: NotFound: No such name or handle exists],
        ],
      }
    `);
  });
});
