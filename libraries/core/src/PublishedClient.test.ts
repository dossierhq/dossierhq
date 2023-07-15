import { describe, expect, test, vi } from 'vitest';
import { expectOkResult, expectResultValue } from './CoreTestUtils.js';
import { ok } from './ErrorResult.js';
import { convertJsonResult } from './JsonUtils.js';
import { NoOpLogger } from './Logger.js';
import type {
  PublishedClient,
  PublishedClientMiddleware,
  PublishedClientOperation,
} from './PublishedClient.js';
import {
  convertJsonPublishedClientResult,
  createBasePublishedClient,
  executePublishedClientOperationFromJson,
  PublishedClientOperationName,
} from './PublishedClient.js';
import type { ClientContext } from './SharedClient.js';
import type { PublishedEntity } from './Types.js';

function createForwardingMiddleware<TContext extends ClientContext>(
  publishedClient: PublishedClient,
): PublishedClientMiddleware<TContext> {
  return async function (_context, operation) {
    const convertedOperationArgs = JSON.parse(JSON.stringify(operation.args));
    // normally sent over HTTP
    const resultJson = await executePublishedClientOperationFromJson(
      publishedClient,
      operation.name,
      convertedOperationArgs,
    );
    // normally returned over HTTP
    const convertedResultJson = convertJsonResult(JSON.parse(JSON.stringify(resultJson)));
    operation.resolve(convertJsonPublishedClientResult(operation.name, convertedResultJson));
  };
}

function createJsonConvertingPublishedClientsForOperation<
  TContext extends ClientContext,
  TName extends (typeof PublishedClientOperationName)[keyof typeof PublishedClientOperationName],
>(
  context: TContext,
  operationName: TName,
  operationHandlerMockImplementation: (
    context: TContext,
    operation: PublishedClientOperation<TName>,
  ) => Promise<void>,
) {
  const operationHandlerMock = vi.fn<[TContext, PublishedClientOperation<TName>], Promise<void>>();
  operationHandlerMock.mockImplementation(operationHandlerMockImplementation);

  const innerMiddleware: PublishedClientMiddleware<TContext> = async (context, operation) => {
    expect(operation.name).toBe(operationName);
    await operationHandlerMock(context, operation as unknown as PublishedClientOperation<TName>);
  };
  const innerPublishedClient = createBasePublishedClient<TContext>({
    context,
    pipeline: [innerMiddleware],
  });
  const outerPublishedClient = createBasePublishedClient<TContext>({
    context,
    pipeline: [createForwardingMiddleware(innerPublishedClient)],
  });
  return { publishedClient: outerPublishedClient, operationHandlerMock };
}

function createDummyEntity({ id }: { id: string }): PublishedEntity {
  return {
    id,
    info: {
      name: 'Foo name',
      type: 'FooType',
      authKey: 'none',
      valid: true,
      createdAt: new Date('2021-08-17T07:51:25.56Z'),
    },
    fields: {},
  };
}

describe('PublishedClient forward operation over JSON', () => {
  test('getEntities', async () => {
    const { publishedClient, operationHandlerMock } =
      createJsonConvertingPublishedClientsForOperation(
        { logger: NoOpLogger },
        PublishedClientOperationName.getEntities,
        async (_context, operation) => {
          const [references] = operation.args;
          operation.resolve(ok(references.map(({ id }) => ok(createDummyEntity({ id })))));
        },
      );

    const result = await publishedClient.getEntities([{ id: '1234' }, { id: '5678' }]);
    if (expectOkResult(result)) {
      if (expectOkResult(result.value[0])) {
        expect(result.value[0].value.info.createdAt).toBeInstanceOf(Date);
      }
      if (expectOkResult(result.value[1])) {
        expect(result.value[1].value.info.createdAt).toBeInstanceOf(Date);
      }

      expect(result.value).toMatchInlineSnapshot(`
        [
          OkResult {
            "value": {
              "fields": {},
              "id": "1234",
              "info": {
                "authKey": "none",
                "createdAt": 2021-08-17T07:51:25.560Z,
                "name": "Foo name",
                "type": "FooType",
                "valid": true,
              },
            },
          },
          OkResult {
            "value": {
              "fields": {},
              "id": "5678",
              "info": {
                "authKey": "none",
                "createdAt": 2021-08-17T07:51:25.560Z,
                "name": "Foo name",
                "type": "FooType",
                "valid": true,
              },
            },
          },
        ]
      `);
    }

    expect(operationHandlerMock.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "logger": {
              "debug": [Function],
              "error": [Function],
              "info": [Function],
              "warn": [Function],
            },
          },
          {
            "args": [
              [
                {
                  "id": "1234",
                },
                {
                  "id": "5678",
                },
              ],
            ],
            "modifies": false,
            "name": "getEntities",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('getEntity', async () => {
    const { publishedClient, operationHandlerMock } =
      createJsonConvertingPublishedClientsForOperation(
        { logger: NoOpLogger },
        PublishedClientOperationName.getEntity,
        async (_context, operation) => {
          const [reference] = operation.args;
          operation.resolve(
            ok(
              createDummyEntity({
                id: 'id' in reference ? reference.id : `${reference.index}/${reference.value}`,
              }),
            ),
          );
        },
      );

    const result = await publishedClient.getEntity({ id: '1234' });
    if (expectOkResult(result)) {
      expect(result.value.info.createdAt).toBeInstanceOf(Date);
      expect(result.value).toMatchInlineSnapshot(`
        {
          "fields": {},
          "id": "1234",
          "info": {
            "authKey": "none",
            "createdAt": 2021-08-17T07:51:25.560Z,
            "name": "Foo name",
            "type": "FooType",
            "valid": true,
          },
        }
      `);
    }

    expect(operationHandlerMock.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "logger": {
              "debug": [Function],
              "error": [Function],
              "info": [Function],
              "warn": [Function],
            },
          },
          {
            "args": [
              {
                "id": "1234",
              },
            ],
            "modifies": false,
            "name": "getEntity",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('getSchemaSpecification', async () => {
    const { publishedClient, operationHandlerMock } =
      createJsonConvertingPublishedClientsForOperation(
        { logger: NoOpLogger },
        PublishedClientOperationName.getSchemaSpecification,
        async (_context, operation) => {
          operation.resolve(
            ok({ version: 0, entityTypes: [], valueTypes: [], patterns: [], indexes: [] }),
          );
        },
      );

    const result = await publishedClient.getSchemaSpecification();
    expectOkResult(result) &&
      expect(result.value).toMatchInlineSnapshot(`
        {
          "entityTypes": [],
          "indexes": [],
          "patterns": [],
          "valueTypes": [],
          "version": 0,
        }
      `);

    expect(operationHandlerMock.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "logger": {
              "debug": [Function],
              "error": [Function],
              "info": [Function],
              "warn": [Function],
            },
          },
          {
            "args": [],
            "modifies": false,
            "name": "getSchemaSpecification",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('getTotalCount', async () => {
    const { publishedClient, operationHandlerMock } =
      createJsonConvertingPublishedClientsForOperation(
        { logger: NoOpLogger },
        PublishedClientOperationName.getTotalCount,
        async (_context, operation) => {
          const [_query] = operation.args;
          operation.resolve(ok(123));
        },
      );

    const result = await publishedClient.getTotalCount({
      boundingBox: { minLat: 0, maxLat: 1, minLng: 20, maxLng: 21 },
    });
    expectResultValue(result, 123);

    expect(operationHandlerMock.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "logger": {
              "debug": [Function],
              "error": [Function],
              "info": [Function],
              "warn": [Function],
            },
          },
          {
            "args": [
              {
                "boundingBox": {
                  "maxLat": 1,
                  "maxLng": 21,
                  "minLat": 0,
                  "minLng": 20,
                },
              },
            ],
            "modifies": false,
            "name": "getTotalCount",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('sampleEntities', async () => {
    const entity1: PublishedEntity = {
      id: 'id',
      info: {
        type: 'Foo',
        name: 'Name',
        authKey: 'none',
        valid: true,
        createdAt: new Date(),
      },
      fields: { foo: 'Hello' },
    };

    const { publishedClient, operationHandlerMock } =
      createJsonConvertingPublishedClientsForOperation(
        { logger: NoOpLogger },
        PublishedClientOperationName.sampleEntities,
        async (_context, operation) => {
          const [_query, _options] = operation.args;
          operation.resolve(ok({ seed: 123, totalCount: 1, items: [entity1] }));
        },
      );

    const result = await publishedClient.sampleEntities(
      { boundingBox: { minLat: 0, maxLat: 1, minLng: 20, maxLng: 21 } },
      { count: 10 },
    );
    expectResultValue(result, { seed: 123, totalCount: 1, items: [entity1] });

    expectOkResult(result) && expect(result.value.items[0].info.createdAt).toBeInstanceOf(Date);

    expect(operationHandlerMock.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "logger": {
              "debug": [Function],
              "error": [Function],
              "info": [Function],
              "warn": [Function],
            },
          },
          {
            "args": [
              {
                "boundingBox": {
                  "maxLat": 1,
                  "maxLng": 21,
                  "minLat": 0,
                  "minLng": 20,
                },
              },
              {
                "count": 10,
              },
            ],
            "modifies": false,
            "name": "sampleEntities",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('searchEntities', async () => {
    const entity1: PublishedEntity = {
      id: 'id',
      info: {
        type: 'Foo',
        name: 'Name',
        authKey: 'none',
        valid: true,
        createdAt: new Date(),
      },
      fields: { foo: 'Hello' },
    };

    const { publishedClient, operationHandlerMock } =
      createJsonConvertingPublishedClientsForOperation(
        { logger: NoOpLogger },
        PublishedClientOperationName.searchEntities,
        async (_context, operation) => {
          const [_query, _paging] = operation.args;
          operation.resolve(
            ok({
              pageInfo: {
                hasPreviousPage: false,
                hasNextPage: true,
                startCursor: 'start-cursor',
                endCursor: 'end-cursor',
              },
              edges: [
                {
                  cursor: 'entity-1',
                  node: ok(entity1),
                },
              ],
            }),
          );
        },
      );

    const result = await publishedClient.searchEntities(
      { boundingBox: { minLat: 0, maxLat: 1, minLng: 20, maxLng: 21 } },
      { first: 100, after: 'cursor' },
    );
    expectResultValue(result, {
      pageInfo: {
        hasPreviousPage: false,
        hasNextPage: true,
        startCursor: 'start-cursor',
        endCursor: 'end-cursor',
      },
      edges: [
        {
          cursor: 'entity-1',
          node: ok(entity1),
        },
      ],
    });

    expectOkResult(result) &&
      result.value?.edges[0].node &&
      expectOkResult(result.value.edges[0].node) &&
      expect(result.value?.edges[0].node.value.info.createdAt).toBeInstanceOf(Date);

    expect(operationHandlerMock.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "logger": {
              "debug": [Function],
              "error": [Function],
              "info": [Function],
              "warn": [Function],
            },
          },
          {
            "args": [
              {
                "boundingBox": {
                  "maxLat": 1,
                  "maxLng": 21,
                  "minLat": 0,
                  "minLng": 20,
                },
              },
              {
                "after": "cursor",
                "first": 100,
              },
            ],
            "modifies": false,
            "name": "searchEntities",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('searchEntities (null)', async () => {
    const { publishedClient, operationHandlerMock } =
      createJsonConvertingPublishedClientsForOperation(
        { logger: NoOpLogger },
        PublishedClientOperationName.searchEntities,
        async (_context, operation) => {
          const [_query, _paging] = operation.args;
          operation.resolve(ok(null));
        },
      );

    const result = await publishedClient.searchEntities();
    expectResultValue(result, null);

    expect(operationHandlerMock.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "logger": {
              "debug": [Function],
              "error": [Function],
              "info": [Function],
              "warn": [Function],
            },
          },
          {
            "args": [
              null,
              null,
            ],
            "modifies": false,
            "name": "searchEntities",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });
});
