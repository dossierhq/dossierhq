import type { AdminClient, AdminClientMiddleware, AdminClientOperation } from '.';
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
import { expectOkResult } from './CoreTestUtils';

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
          })
        );
      }
    );

    const result = await adminClient.archiveEntity({ id: '1234' });
    expectOkResult(result) &&
      expect(result.value).toEqual({ id: '1234', publishState: EntityPublishState.Archived });

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
});
