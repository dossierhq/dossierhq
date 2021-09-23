import { Temporal } from '@js-temporal/polyfill';
import type { AdminClient, AdminClientMiddleware, AdminClientOperation, AdminEntity } from '.';
import {
  AdminClientOperationName,
  assertIsDefined,
  convertAdminClientOperationToJson,
  convertJsonAdminClientResult,
  convertJsonResult,
  createBaseAdminClient,
  EntityPublishState,
  executeAdminClientOperationFromJson,
  ok,
} from '.';
import { expectOkResult, expectResultValue } from './CoreTestUtils';

function createForwardingMiddleware<TContext>(
  adminClient: AdminClient
): AdminClientMiddleware<TContext> {
  return async function (_context, operation) {
    const operationJson = convertAdminClientOperationToJson(operation);
    const convertedOperation = JSON.parse(JSON.stringify(operationJson));
    // normally sent over HTTP
    const resultJson = await executeAdminClientOperationFromJson(
      adminClient,
      operation.name,
      convertedOperation
    );
    // normally returned over HTTP
    const convertedResultJson = convertJsonResult(JSON.parse(JSON.stringify(resultJson)));
    operation.resolve(convertJsonAdminClientResult(operation.name, convertedResultJson));
  };
}

function createJsonConvertingAdminClientsForOperation<
  TContext,
  TName extends AdminClientOperationName
>(
  context: TContext,
  operationName: TName,
  operationHandlerMockImplementation: (
    context: TContext,
    operation: AdminClientOperation<TName>
  ) => Promise<void>
) {
  const operationHandlerMock = jest.fn<Promise<void>, [TContext, AdminClientOperation<TName>]>();
  operationHandlerMock.mockImplementation(operationHandlerMockImplementation);

  const innerMiddleware: AdminClientMiddleware<TContext> = async (context, operation) => {
    expect(operation.name).toBe(operationName);
    await operationHandlerMock(context, operation as unknown as AdminClientOperation<TName>);
  };
  const innerAdminClient = createBaseAdminClient<TContext>({
    context,
    pipeline: [innerMiddleware],
  });
  const outerAdminClient = createBaseAdminClient<TContext>({
    context,
    pipeline: [createForwardingMiddleware(innerAdminClient)],
  });
  return { adminClient: outerAdminClient, operationHandlerMock };
}

function createDummyEntity({ id }: { id: string }): AdminEntity {
  return {
    id,
    info: {
      name: 'Foo name',
      type: 'FooType',
      version: 0,
      publishingState: EntityPublishState.Draft,
      createdAt: Temporal.Instant.from('2021-08-17T07:51:25.56Z'),
      updatedAt: Temporal.Instant.from('2021-08-17T07:51:25.56Z'),
    },
    fields: {},
  };
}

//TODO test all operations
describe('AdminClient forward operation over JSON', () => {
  test('archiveEntity', async () => {
    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      null,
      AdminClientOperationName.archiveEntity,
      async (_context, operation) => {
        const [reference] = operation.args;
        operation.resolve(
          ok({
            id: reference.id,
            publishState: EntityPublishState.Archived,
            updatedAt: Temporal.Instant.from('2021-08-17T08:51:25.56Z'),
          })
        );
      }
    );

    const result = await adminClient.archiveEntity({ id: '1234' });
    expectResultValue(result, {
      id: '1234',
      publishState: EntityPublishState.Archived,
      updatedAt: Temporal.Instant.from('2021-08-17T08:51:25.56Z'),
    });
    expectOkResult(result) && expect(result.value.updatedAt).toBeInstanceOf(Temporal.Instant);

    expect(operationHandlerMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          null,
          Object {
            "args": Array [
              Object {
                "id": "1234",
              },
            ],
            "modifies": true,
            "name": "archiveEntity",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('getEntities', async () => {
    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      null,
      AdminClientOperationName.getEntities,
      async (_context, operation) => {
        const [references] = operation.args;
        operation.resolve(ok(references.map(({ id }) => ok(createDummyEntity({ id })))));
      }
    );

    const result = await adminClient.getEntities([{ id: '1234' }, { id: '5678' }]);
    expectOkResult(result) &&
      expect(result.value).toMatchInlineSnapshot(`
        Object {
          "value": Array [
            Object {
              "value": Object {
                "fields": Object {},
                "id": "1234",
                "info": Object {
                  "createdAt": "2021-08-17T07:51:25.56Z",
                  "name": "Foo name",
                  "publishingState": "draft",
                  "type": "FooType",
                  "updatedAt": "2021-08-17T07:51:25.56Z",
                  "version": 0,
                },
              },
            },
            Object {
              "value": Object {
                "fields": Object {},
                "id": "5678",
                "info": Object {
                  "createdAt": "2021-08-17T07:51:25.56Z",
                  "name": "Foo name",
                  "publishingState": "draft",
                  "type": "FooType",
                  "updatedAt": "2021-08-17T07:51:25.56Z",
                  "version": 0,
                },
              },
            },
          ],
        }
      `);

    expect(operationHandlerMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          null,
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

  test('publishEntities', async () => {
    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      null,
      AdminClientOperationName.publishEntities,
      async (_context, operation) => {
        const [references] = operation.args;
        operation.resolve(
          ok(
            references.map((it) => ({
              id: it.id,
              publishState: EntityPublishState.Published,
              updatedAt: Temporal.Instant.from('2021-08-17T08:51:25.56Z'),
            }))
          )
        );
      }
    );

    const result = await adminClient.publishEntities([
      { id: '1234', version: 0 },
      { id: '4321', version: 1 },
    ]);
    expectResultValue(result, [
      {
        id: '1234',
        publishState: EntityPublishState.Published,
        updatedAt: Temporal.Instant.from('2021-08-17T08:51:25.56Z'),
      },
      {
        id: '4321',
        publishState: EntityPublishState.Published,
        updatedAt: Temporal.Instant.from('2021-08-17T08:51:25.56Z'),
      },
    ]);
    expectOkResult(result) && expect(result.value[0].updatedAt).toBeInstanceOf(Temporal.Instant);
    expectOkResult(result) && expect(result.value[1].updatedAt).toBeInstanceOf(Temporal.Instant);

    expect(operationHandlerMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          null,
          Object {
            "args": Array [
              Array [
                Object {
                  "id": "1234",
                  "version": 0,
                },
                Object {
                  "id": "4321",
                  "version": 1,
                },
              ],
            ],
            "modifies": true,
            "name": "publishEntities",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('searchEntities', async () => {
    const entity1: AdminEntity = {
      id: 'id',
      info: {
        type: 'Foo',
        name: 'Name',
        version: 2,
        publishingState: EntityPublishState.Published,
        createdAt: Temporal.Instant.from('2021-08-17T08:51:25.56Z'),
        updatedAt: Temporal.Instant.from('2021-10-17T08:51:25.56Z'),
      },
      fields: { foo: 'Hello' },
    };

    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      null,
      AdminClientOperationName.searchEntities,
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

    const result = await adminClient.searchEntities(
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

    if (expectOkResult(result)) {
      const node = result.value?.edges[0].node;
      assertIsDefined(node);
      if (expectOkResult(node)) {
        expect(node.value.info.createdAt).toBeInstanceOf(Temporal.Instant);
        expect(node.value.info.updatedAt).toBeInstanceOf(Temporal.Instant);
      }
    }

    expect(operationHandlerMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          null,
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
    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      null,
      AdminClientOperationName.searchEntities,
      async (_context, operation) => {
        const [_query, _paging] = operation.args;
        operation.resolve(ok(null));
      }
    );

    const result = await adminClient.searchEntities();
    expectResultValue(result, null);

    expect(operationHandlerMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          null,
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

  test('unarchiveEntity', async () => {
    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      null,
      AdminClientOperationName.unarchiveEntity,
      async (_context, operation) => {
        const [reference] = operation.args;
        operation.resolve(
          ok({
            id: reference.id,
            publishState: EntityPublishState.Withdrawn,
            updatedAt: Temporal.Instant.from('2021-08-17T08:51:25.56Z'),
          })
        );
      }
    );

    const result = await adminClient.unarchiveEntity({ id: '1234' });
    expectResultValue(result, {
      id: '1234',
      publishState: EntityPublishState.Withdrawn,
      updatedAt: Temporal.Instant.from('2021-08-17T08:51:25.56Z'),
    });
    expectOkResult(result) && expect(result.value.updatedAt).toBeInstanceOf(Temporal.Instant);

    expect(operationHandlerMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          null,
          Object {
            "args": Array [
              Object {
                "id": "1234",
              },
            ],
            "modifies": true,
            "name": "unarchiveEntity",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('unpublishEntities', async () => {
    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      null,
      AdminClientOperationName.unpublishEntities,
      async (_context, operation) => {
        const [references] = operation.args;
        operation.resolve(
          ok(
            references.map((it) => ({
              id: it.id,
              publishState: EntityPublishState.Withdrawn,
              updatedAt: Temporal.Instant.from('2021-08-17T08:51:25.56Z'),
            }))
          )
        );
      }
    );

    const result = await adminClient.unpublishEntities([{ id: '1234' }, { id: '4321' }]);
    expectResultValue(result, [
      {
        id: '1234',
        publishState: EntityPublishState.Withdrawn,
        updatedAt: Temporal.Instant.from('2021-08-17T08:51:25.56Z'),
      },
      {
        id: '4321',
        publishState: EntityPublishState.Withdrawn,
        updatedAt: Temporal.Instant.from('2021-08-17T08:51:25.56Z'),
      },
    ]);
    expectOkResult(result) && expect(result.value[0].updatedAt).toBeInstanceOf(Temporal.Instant);
    expectOkResult(result) && expect(result.value[1].updatedAt).toBeInstanceOf(Temporal.Instant);

    expect(operationHandlerMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          null,
          Object {
            "args": Array [
              Array [
                Object {
                  "id": "1234",
                },
                Object {
                  "id": "4321",
                },
              ],
            ],
            "modifies": true,
            "name": "unpublishEntities",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });
});
