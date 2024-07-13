import { describe, expect, test, vi } from 'vitest';
import { ok } from '../ErrorResult.js';
import { NoOpLogger } from '../Logger.js';
import { expectOkResult, expectResultValue } from '../test/CoreTestUtils.js';
import type { PublishedEntity } from '../Types.js';
import { convertJsonResult } from './JsonUtils.js';
import {
  convertJsonPublishedDossierClientResult,
  createBasePublishedDossierClient,
  executeJsonPublishedDossierClientOperation,
  PublishedDossierClientOperationName,
  type JsonPublishedDossierClientOperationArgs,
  type PublishedDossierClient,
  type PublishedDossierClientMiddleware,
  type PublishedDossierClientOperation,
} from './PublishedDossierClient.js';
import type { ClientContext } from './SharedClient.js';

function createForwardingMiddleware<TContext extends ClientContext>(
  publishedClient: PublishedDossierClient,
): PublishedDossierClientMiddleware<TContext> {
  return async function (_context, operation) {
    const convertedOperationArgs = JSON.parse(
      JSON.stringify(operation.args),
    ) as JsonPublishedDossierClientOperationArgs;
    // normally sent over HTTP
    const resultJson = await executeJsonPublishedDossierClientOperation(
      publishedClient,
      operation.name,
      convertedOperationArgs,
    );
    // normally returned over HTTP
    const convertedResultJson = convertJsonResult(
      JSON.parse(JSON.stringify(resultJson)) as typeof resultJson,
    );
    operation.resolve(convertJsonPublishedDossierClientResult(operation.name, convertedResultJson));
  };
}

function createJsonConvertingPublishedClientsForOperation<
  TContext extends ClientContext,
  TName extends
    (typeof PublishedDossierClientOperationName)[keyof typeof PublishedDossierClientOperationName],
>(
  context: TContext,
  operationName: TName,
  operationHandlerMockImplementation: (
    context: TContext,
    operation: PublishedDossierClientOperation<TName>,
  ) => Promise<void>,
) {
  const operationHandlerMock = vi.fn<typeof operationHandlerMockImplementation>();
  operationHandlerMock.mockImplementation(operationHandlerMockImplementation);

  const innerMiddleware: PublishedDossierClientMiddleware<TContext> = async (
    context,
    operation,
  ) => {
    expect(operation.name).toBe(operationName);
    await operationHandlerMock(
      context,
      operation as unknown as PublishedDossierClientOperation<TName>,
    );
  };
  const innerPublishedClient = createBasePublishedDossierClient<TContext>({
    context,
    pipeline: [innerMiddleware],
  });
  const outerPublishedClient = createBasePublishedDossierClient<TContext>({
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
      authKey: '',
      valid: true,
      createdAt: new Date('2021-08-17T07:51:25.56Z'),
    },
    fields: {},
  };
}

describe('PublishedDossierClient forward operation over JSON', () => {
  test('getEntityList', async () => {
    const { publishedClient, operationHandlerMock } =
      createJsonConvertingPublishedClientsForOperation(
        { logger: NoOpLogger },
        PublishedDossierClientOperationName.getEntityList,
        (_context, operation) => {
          const [references] = operation.args;
          operation.resolve(ok(references.map(({ id }) => ok(createDummyEntity({ id })))));
          return Promise.resolve();
        },
      );

    const result = await publishedClient.getEntityList([{ id: '1234' }, { id: '5678' }]);
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
                "authKey": "",
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
                "authKey": "",
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
            "name": "getEntityList",
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
        PublishedDossierClientOperationName.getEntity,
        (_context, operation) => {
          const [reference] = operation.args;
          operation.resolve(
            ok(
              createDummyEntity({
                id: 'id' in reference ? reference.id : `${reference.index}/${reference.value}`,
              }),
            ),
          );
          return Promise.resolve();
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
            "authKey": "",
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
        PublishedDossierClientOperationName.getSchemaSpecification,
        (_context, operation) => {
          operation.resolve(
            ok({
              schemaKind: 'published',
              version: 0,
              entityTypes: [],
              componentTypes: [],
              patterns: [],
              indexes: [],
            }),
          );
          return Promise.resolve();
        },
      );

    const result = await publishedClient.getSchemaSpecification();
    expectOkResult(result) &&
      expect(result.value).toMatchInlineSnapshot(`
        {
          "componentTypes": [],
          "entityTypes": [],
          "indexes": [],
          "patterns": [],
          "schemaKind": "published",
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

  test('getEntitiesTotalCount', async () => {
    const { publishedClient, operationHandlerMock } =
      createJsonConvertingPublishedClientsForOperation(
        { logger: NoOpLogger },
        PublishedDossierClientOperationName.getEntitiesTotalCount,
        (_context, operation) => {
          const [_query] = operation.args;
          operation.resolve(ok(123));
          return Promise.resolve();
        },
      );

    const result = await publishedClient.getEntitiesTotalCount({
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
            "name": "getEntitiesTotalCount",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('getEntitiesSample', async () => {
    const entity1: PublishedEntity = {
      id: 'id',
      info: {
        type: 'Foo',
        name: 'Name',
        authKey: '',
        valid: true,
        createdAt: new Date(),
      },
      fields: { foo: 'Hello' },
    };

    const { publishedClient, operationHandlerMock } =
      createJsonConvertingPublishedClientsForOperation(
        { logger: NoOpLogger },
        PublishedDossierClientOperationName.getEntitiesSample,
        (_context, operation) => {
          const [_query, _options] = operation.args;
          operation.resolve(ok({ seed: 123, totalCount: 1, items: [entity1] }));
          return Promise.resolve();
        },
      );

    const result = await publishedClient.getEntitiesSample(
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
            "name": "getEntitiesSample",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('getEntities', async () => {
    const entity1: PublishedEntity = {
      id: 'id',
      info: {
        type: 'Foo',
        name: 'Name',
        authKey: '',
        valid: true,
        createdAt: new Date(),
      },
      fields: { foo: 'Hello' },
    };

    const { publishedClient, operationHandlerMock } =
      createJsonConvertingPublishedClientsForOperation(
        { logger: NoOpLogger },
        PublishedDossierClientOperationName.getEntities,
        (_context, operation) => {
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
          return Promise.resolve();
        },
      );

    const result = await publishedClient.getEntities(
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
            "name": "getEntities",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('getEntities (null)', async () => {
    const { publishedClient, operationHandlerMock } =
      createJsonConvertingPublishedClientsForOperation(
        { logger: NoOpLogger },
        PublishedDossierClientOperationName.getEntities,
        (_context, operation) => {
          const [_query, _paging] = operation.args;
          operation.resolve(ok(null));
          return Promise.resolve();
        },
      );

    const result = await publishedClient.getEntities();
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
            "name": "getEntities",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });
});
