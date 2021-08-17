import { Temporal } from '@js-temporal/polyfill';
import type { AdminClient, AdminClientMiddleware, AdminClientOperation, AdminEntity } from '.';
import {
  AdminClientOperationName,
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
