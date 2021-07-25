import type { AdminClientOperation } from '.';
import { AdminClientOperationName, createBaseAdminClient } from '.';
import { convertAdminClientOperationToJson } from './AdminClient';
import { assertExhaustive } from './Asserts';
import { notOk } from './ErrorResult';

function createConvertToJsonMiddleware() {
  const consumeJsonMock = jest.fn();
  async function dummyMiddleware(context: null, operation: AdminClientOperation) {
    consumeJsonMock(convertAdminClientOperationToJson(operation));
    switch (operation.name) {
      case AdminClientOperationName.archiveEntity: {
        const {
          args: [reference],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.archiveEntity>;
        resolve(notOk.NotFound('Dummy'));
        break;
      }
      case AdminClientOperationName.createEntity: {
        const {
          args: [entity],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.createEntity>;
        resolve(notOk.BadRequest('Dummy'));
        break;
      }
      case AdminClientOperationName.getEntities: {
        const {
          args: [references],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.getEntities>;
        resolve([notOk.NotFound('Dummy')]);
        break;
      }
      case AdminClientOperationName.getEntity: {
        const {
          args: [reference],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.getEntity>;
        resolve(notOk.NotFound('Dummy'));
        break;
      }
      case AdminClientOperationName.getEntityHistory: {
        const {
          args: [reference],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.getEntityHistory>;
        resolve(notOk.NotFound('Dummy'));
        break;
      }
      case AdminClientOperationName.getPublishingHistory: {
        const {
          args: [reference],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.getPublishingHistory>;
        resolve(notOk.NotFound('Dummy'));
        break;
      }
      case AdminClientOperationName.getTotalCount: {
        const {
          args: [query],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.getTotalCount>;
        resolve(notOk.BadRequest('Dummy'));
        break;
      }
      case AdminClientOperationName.publishEntities: {
        const {
          args: [references],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.publishEntities>;
        resolve(notOk.BadRequest('Dummy'));
        break;
      }
      case AdminClientOperationName.searchEntities: {
        const {
          args: [query, paging],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.searchEntities>;
        resolve(notOk.BadRequest('Dummy'));
        break;
      }
      case AdminClientOperationName.unarchiveEntity: {
        const {
          args: [reference],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.unarchiveEntity>;
        resolve(notOk.BadRequest('Dummy'));
        break;
      }
      case AdminClientOperationName.unpublishEntities: {
        const {
          args: [references],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.unpublishEntities>;
        resolve(notOk.BadRequest('Dummy'));
        break;
      }
      case AdminClientOperationName.updateEntity: {
        const {
          args: [entity],
          resolve,
        } = operation as AdminClientOperation<AdminClientOperationName.updateEntity>;
        resolve(notOk.BadRequest('Dummy'));
        break;
      }
      default:
        assertExhaustive(operation.name);
    }
  }
  const adminClient = createBaseAdminClient<null>({ context: null, pipeline: [dummyMiddleware] });
  return { adminClient, consumeJsonMock };
}

describe('convertAdminClientOperationToJson', () => {
  test('archiveEntity', async () => {
    const { adminClient, consumeJsonMock } = createConvertToJsonMiddleware();
    await adminClient.archiveEntity({ id: '1234' });
    expect(consumeJsonMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "args": Array [
              Object {
                "id": "1234",
              },
            ],
            "name": "archiveEntity",
          },
        ],
      ]
    `);
  });
});
