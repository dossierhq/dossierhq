import { ok } from '@jonasb/datadata-core';
import { expectOkResult, expectResultValue } from '@jonasb/datadata-core-jest';
import type { GraphQLSchema } from 'graphql';
import { graphql } from 'graphql';
import type { SessionGraphQLContext } from '..';
import { GraphQLSchemaGenerator } from '..';
import type { TestServerWithSession } from './TestUtils';
import { setUpServerWithSession } from './TestUtils';

let server: TestServerWithSession;
let schema: GraphQLSchema;

beforeAll(async () => {
  server = await setUpServerWithSession({});
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
        Object {
          "data": Object {
            "acquireAdvisoryLock": null,
          },
          "errors": Array [
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
      variableValues: { name: 'Invalid loch name', handle: 123 },
    })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    expect(result).toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "renewAdvisoryLock": null,
        },
        "errors": Array [
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
      Object {
        "data": Object {
          "releaseAdvisoryLock": null,
        },
        "errors": Array [
          [GraphQLError: NotFound: No such name or handle exists],
        ],
      }
    `);
  });
});
