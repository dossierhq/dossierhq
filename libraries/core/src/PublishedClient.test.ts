import type {
  Entity,
  PublishedClient,
  PublishedClientMiddleware,
  PublishedClientOperation,
} from '.';
import {
  convertJsonPublishedClientResult,
  convertJsonResult,
  convertPublishedClientOperationToJson,
  createBasePublishedClient,
  executePublishedClientOperationFromJson,
  NoOpLogger,
  ok,
  PublishedClientOperationName,
} from '.';
import { expectOkResult, expectResultValue } from './CoreTestUtils';
import type { ClientContext } from './SharedClient';

function createForwardingMiddleware<TContext extends ClientContext>(
  publishedClient: PublishedClient
): PublishedClientMiddleware<TContext> {
  return async function (_context, operation) {
    const operationJson = convertPublishedClientOperationToJson(operation);
    const convertedOperation = JSON.parse(JSON.stringify(operationJson));
    // normally sent over HTTP
    const resultJson = await executePublishedClientOperationFromJson(
      publishedClient,
      operation.name,
      convertedOperation
    );
    // normally returned over HTTP
    const convertedResultJson = convertJsonResult(JSON.parse(JSON.stringify(resultJson)));
    operation.resolve(convertJsonPublishedClientResult(operation.name, convertedResultJson));
  };
}

function createJsonConvertingPublishedClientsForOperation<
  TContext extends ClientContext,
  TName extends PublishedClientOperationName
>(
  context: TContext,
  operationName: TName,
  operationHandlerMockImplementation: (
    context: TContext,
    operation: PublishedClientOperation<TName>
  ) => Promise<void>
) {
  const operationHandlerMock = jest.fn<
    Promise<void>,
    [TContext, PublishedClientOperation<TName>]
  >();
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

function createDummyEntity({ id }: { id: string }): Entity {
  return {
    id,
    info: {
      name: 'Foo name',
      type: 'FooType',
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
        }
      );

    const result = await publishedClient.getEntities([{ id: '1234' }, { id: '5678' }]);
    if (expectOkResult(result)) {
      expect(result.value[0].isOk()).toBeTruthy();
      expect(result.value[1].isOk()).toBeTruthy();

      expect(result.value).toMatchInlineSnapshot(`
        Array [
          OkResult {
            "value": Object {
              "fields": Object {},
              "id": "1234",
              "info": Object {
                "name": "Foo name",
                "type": "FooType",
              },
            },
          },
          OkResult {
            "value": Object {
              "fields": Object {},
              "id": "5678",
              "info": Object {
                "name": "Foo name",
                "type": "FooType",
              },
            },
          },
        ]
      `);
    }

    expect(operationHandlerMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "logger": Object {
              "debug": [Function],
              "error": [Function],
              "info": [Function],
              "warn": [Function],
            },
          },
          Object {
            "args": Array [
              Array [
                Object {
                  "id": "1234",
                },
                Object {
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
          operation.resolve(ok(createDummyEntity({ id: reference.id })));
        }
      );

    const result = await publishedClient.getEntity({ id: '1234' });
    expectOkResult(result) &&
      expect(result.value).toMatchInlineSnapshot(`
        Object {
          "fields": Object {},
          "id": "1234",
          "info": Object {
            "name": "Foo name",
            "type": "FooType",
          },
        }
      `);

    expect(operationHandlerMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "logger": Object {
              "debug": [Function],
              "error": [Function],
              "info": [Function],
              "warn": [Function],
            },
          },
          Object {
            "args": Array [
              Object {
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
          operation.resolve(ok({ entityTypes: [], valueTypes: [] }));
        }
      );

    const result = await publishedClient.getSchemaSpecification();
    expectOkResult(result) &&
      expect(result.value).toMatchInlineSnapshot(`
        Object {
          "entityTypes": Array [],
          "valueTypes": Array [],
        }
      `);

    expect(operationHandlerMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "logger": Object {
              "debug": [Function],
              "error": [Function],
              "info": [Function],
              "warn": [Function],
            },
          },
          Object {
            "args": Array [],
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
        }
      );

    const result = await publishedClient.getTotalCount({
      boundingBox: { minLat: 0, maxLat: 1, minLng: 20, maxLng: 21 },
    });
    expectResultValue(result, 123);

    expect(operationHandlerMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "logger": Object {
              "debug": [Function],
              "error": [Function],
              "info": [Function],
              "warn": [Function],
            },
          },
          Object {
            "args": Array [
              Object {
                "boundingBox": Object {
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

  test('searchEntities', async () => {
    const entity1: Entity = {
      id: 'id',
      info: {
        type: 'Foo',
        name: 'Name',
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
            })
          );
        }
      );

    const result = await publishedClient.searchEntities(
      { boundingBox: { minLat: 0, maxLat: 1, minLng: 20, maxLng: 21 } },
      { first: 100, after: 'cursor' }
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

    expect(operationHandlerMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "logger": Object {
              "debug": [Function],
              "error": [Function],
              "info": [Function],
              "warn": [Function],
            },
          },
          Object {
            "args": Array [
              Object {
                "boundingBox": Object {
                  "maxLat": 1,
                  "maxLng": 21,
                  "minLat": 0,
                  "minLng": 20,
                },
              },
              Object {
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
        }
      );

    const result = await publishedClient.searchEntities();
    expectResultValue(result, null);

    expect(operationHandlerMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "logger": Object {
              "debug": [Function],
              "error": [Function],
              "info": [Function],
              "warn": [Function],
            },
          },
          Object {
            "args": Array [
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
