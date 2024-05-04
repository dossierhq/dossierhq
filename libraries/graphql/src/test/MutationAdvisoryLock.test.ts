import { ok } from '@dossierhq/core';
import { expectOkResult, expectResultValue } from '@dossierhq/core-vitest';
import { graphql, type ExecutionResult, type GraphQLSchema } from 'graphql';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { GraphQLSchemaGenerator, type SessionGraphQLContext } from '../GraphQLSchemaGenerator.js';
import { setUpServerWithSession, type TestServerWithSession } from './TestUtils.js';

const gql = String.raw;

let server: TestServerWithSession;
let schema: GraphQLSchema;

beforeAll(async () => {
  server = await setUpServerWithSession(
    { entityTypes: [{ name: 'Placeholder', fields: [] }] },
    'data/advisory-lock.sqlite',
  );
  schema = new GraphQLSchemaGenerator({
    schema: server.schema,
    publishedSchema: null,
  }).buildSchema();
});
afterAll(async () => {
  await server?.tearDown();
});

function createContext(): SessionGraphQLContext {
  return {
    client: ok(server.client),
    publishedClient: ok(server.publishedClient),
  };
}

const acquireAdvisoryLockQuery = gql`
  mutation AcquireAdvisoryLock($name: String!, $leaseDuration: Int!) {
    acquireAdvisoryLock(name: $name, leaseDuration: $leaseDuration) {
      name
      handle
    }
  }
`;

type AcquireAdvisoryLockResult = ExecutionResult<{
  acquireAdvisoryLock: { name: string; handle: number };
}>;

const renewAdvisoryLockQuery = gql`
  mutation RenewAdvisoryLock($name: String!, $handle: Int!) {
    renewAdvisoryLock(name: $name, handle: $handle) {
      name
      handle
    }
  }
`;

type RenewAdvisoryLockResult = ExecutionResult<{
  renewAdvisoryLock: { name: string; handle: number };
}>;

const releaseAdvisoryLockQuery = gql`
  mutation ReleaseAdvisoryLock($name: String!, $handle: Int!) {
    releaseAdvisoryLock(name: $name, handle: $handle) {
      name
    }
  }
`;

type ReleaseAdvisoryLockResult = ExecutionResult<{
  releaseAdvisoryLock: { name: string };
}>;

describe('acquireAdvisoryLock()', () => {
  test('Acquire', async () => {
    const { client } = server;

    const result = (await graphql({
      schema,
      source: acquireAdvisoryLockQuery,
      contextValue: createContext(),
      variableValues: { name: 'Acquire', leaseDuration: 500 },
    })) as AcquireAdvisoryLockResult;

    expect(result.errors).toBeUndefined();
    expect(result.data).toBeDefined();
    const { name, handle } = result.data!.acquireAdvisoryLock;
    expect(name).toEqual('Acquire');
    expect(typeof handle).toEqual('number');

    const releaseResult = await client.releaseAdvisoryLock(name, handle);
    expectResultValue(releaseResult, { name });
  });

  test('Error: already locked', async () => {
    const { client } = server;

    const acquireResult = await client.acquireAdvisoryLock('Already locked', {
      leaseDuration: 500,
    });
    if (expectOkResult(acquireResult)) {
      const result = await graphql({
        schema,
        source: acquireAdvisoryLockQuery,
        contextValue: createContext(),
        variableValues: { name: 'Already locked', leaseDuration: 123 },
      });

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
    const { client } = server;
    const acquireResult = await client.acquireAdvisoryLock('Renew', { leaseDuration: 500 });
    if (expectOkResult(acquireResult)) {
      const { name, handle } = acquireResult.value;

      const result = (await graphql({
        schema,
        source: renewAdvisoryLockQuery,
        contextValue: createContext(),
        variableValues: { name, handle },
      })) as RenewAdvisoryLockResult;

      expect(result.errors).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data!.renewAdvisoryLock).toEqual({ name, handle });
    }
  });

  test('Error: renew invalid lock name', async () => {
    const result = await graphql({
      schema,
      source: renewAdvisoryLockQuery,
      contextValue: createContext(),
      variableValues: { name: 'Invalid lock name', handle: 123 },
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "renewAdvisoryLock": null,
        },
        "errors": [
          [GraphQLError: NotFound: Failed renewing lock, no advisory lock with the name 'Invalid lock name' exists],
        ],
      }
    `);
  });
});

describe('releaseAdvisoryLock()', () => {
  test('Release', async () => {
    const { client } = server;
    const acquireResult = await client.acquireAdvisoryLock('Release', { leaseDuration: 500 });
    if (expectOkResult(acquireResult)) {
      const { name, handle } = acquireResult.value;

      const result = (await graphql({
        schema,
        source: releaseAdvisoryLockQuery,
        contextValue: createContext(),
        variableValues: { name, handle },
      })) as ReleaseAdvisoryLockResult;

      expect(result.errors).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data!.releaseAdvisoryLock).toEqual({ name });
    }
  });

  test('Error: release invalid lock name', async () => {
    const result = await graphql({
      schema,
      source: releaseAdvisoryLockQuery,
      contextValue: createContext(),
      variableValues: { name: 'Invalid lock name', handle: 123 },
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "releaseAdvisoryLock": null,
        },
        "errors": [
          [GraphQLError: NotFound: Failed releasing lock, no advisory lock with the name 'Invalid lock name' exists],
        ],
      }
    `);
  });
});
