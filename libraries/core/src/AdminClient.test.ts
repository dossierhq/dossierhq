import { Temporal } from '@js-temporal/polyfill';
import { describe, expect, test, vi } from 'vitest';
import type { AdminClient, AdminClientMiddleware, AdminClientOperation } from './AdminClient.js';
import {
  AdminClientOperationName,
  convertAdminClientOperationToJson,
  convertJsonAdminClientResult,
  createBaseAdminClient,
  executeAdminClientOperationFromJson,
} from './AdminClient.js';
import { assertIsDefined } from './Asserts.js';
import { expectOkResult, expectResultValue } from './CoreTestUtils.js';
import { ok } from './ErrorResult.js';
import { copyEntity } from './ItemUtils.js';
import { convertJsonResult } from './JsonUtils.js';
import { NoOpLogger } from './Logger.js';
import type { ClientContext } from './SharedClient.js';
import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityCreatePayload,
  AdminEntityUpdate,
  AdminEntityUpdatePayload,
  AdminEntityUpsert,
  AdminEntityUpsertPayload,
} from './Types.js';
import { AdminEntityStatus, PublishingEventKind } from './Types.js';

interface FooFields {
  title: string | null;
}
type AdminFooEntity = AdminEntity<'FooType', FooFields>;

function createForwardingMiddleware<TContext extends ClientContext>(
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
  TContext extends ClientContext,
  TName extends keyof typeof AdminClientOperationName
>(
  context: TContext,
  operationName: TName,
  operationHandlerMockImplementation: (
    context: TContext,
    operation: AdminClientOperation<TName>
  ) => Promise<void>
) {
  const operationHandlerMock = vi.fn<[TContext, AdminClientOperation<TName>], Promise<void>>();
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

function createDummyEntity(changes: {
  id?: string;
  info?: Partial<AdminFooEntity['info']>;
  fields?: Partial<AdminFooEntity['fields']>;
}): AdminFooEntity {
  return copyEntity<AdminFooEntity>(
    {
      id: '123',
      info: {
        name: 'Foo name',
        type: 'FooType',
        version: 0,
        authKey: 'none',
        status: AdminEntityStatus.draft,
        createdAt: Temporal.Instant.from('2021-08-17T07:51:25.56Z'),
        updatedAt: Temporal.Instant.from('2021-08-17T07:51:25.56Z'),
      },
      fields: { title: 'Foo title' },
    },
    changes
  );
}

describe('Custom AdminEntity types', () => {
  test('AdminFooEntity creation', async () => {
    const adminClient = createBaseAdminClient({
      context: { logger: NoOpLogger },
      pipeline: [],
    });

    const fooCreate: AdminEntityCreate<AdminFooEntity> = {
      info: { type: 'FooType', name: 'Foo name', authKey: 'none' },
      fields: { title: 'bar value' },
    };

    const _returnedPayload = await adminClient.createEntity<AdminFooEntity>(fooCreate);

    const fooCreatePayload: AdminEntityCreatePayload<AdminFooEntity> = {
      effect: 'created',
      entity: createDummyEntity({}),
    };
    const _fooEntity: AdminFooEntity = fooCreatePayload.entity;
  });

  test('AdminFooEntity update', async () => {
    const adminClient = createBaseAdminClient({
      context: { logger: NoOpLogger },
      pipeline: [],
    });

    const fooUpdate: AdminEntityUpdate<AdminFooEntity> = {
      id: '123',
      info: { type: 'FooType', name: 'Foo name', authKey: 'none' },
      fields: { title: 'bar value' },
    };

    const _returnedPayload = await adminClient.updateEntity<AdminFooEntity>(fooUpdate);

    const fooUpdatePayload: AdminEntityUpdatePayload<AdminFooEntity> = {
      effect: 'updated',
      entity: createDummyEntity({}),
    };
    const _fooEntity: AdminFooEntity = fooUpdatePayload.entity;
  });

  test('AdminFooEntity upsert', async () => {
    const adminClient = createBaseAdminClient({
      context: { logger: NoOpLogger },
      pipeline: [],
    });

    const fooUpsert: AdminEntityUpsert<AdminFooEntity> = {
      id: '123',
      info: { type: 'FooType', name: 'Foo name', authKey: 'none' },
      fields: { title: 'bar value' },
    };

    const _returnedPayload = await adminClient.upsertEntity<AdminFooEntity>(fooUpsert);

    const fooUpsertPayload: AdminEntityUpsertPayload<AdminFooEntity> = {
      effect: 'updated',
      entity: createDummyEntity({}),
    };
    const _fooEntity: AdminFooEntity = fooUpsertPayload.entity;
  });
});

describe('AdminClient forward operation over JSON', () => {
  test('acquireAdvisoryLock', async () => {
    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      { logger: NoOpLogger },
      AdminClientOperationName.acquireAdvisoryLock,
      async (_context, operation) => {
        const [name, _options] = operation.args;
        operation.resolve(ok({ name, handle: 123 }));
      }
    );

    const result = await adminClient.acquireAdvisoryLock('lock-name', { leaseDuration: 100 });
    expectResultValue(result, {
      name: 'lock-name',
      handle: 123,
    });

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
              "lock-name",
              {
                "leaseDuration": 100,
              },
            ],
            "modifies": true,
            "name": "acquireAdvisoryLock",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('archiveEntity', async () => {
    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      { logger: NoOpLogger },
      AdminClientOperationName.archiveEntity,
      async (_context, operation) => {
        const [reference] = operation.args;
        operation.resolve(
          ok({
            id: reference.id,
            status: AdminEntityStatus.archived,
            effect: 'archived',
            updatedAt: Temporal.Instant.from('2021-08-17T08:51:25.56Z'),
          })
        );
      }
    );

    const result = await adminClient.archiveEntity({ id: '1234' });
    expectResultValue(result, {
      id: '1234',
      status: AdminEntityStatus.archived,
      effect: 'archived',
      updatedAt: Temporal.Instant.from('2021-08-17T08:51:25.56Z'),
    });
    expectOkResult(result) && expect(result.value.updatedAt).toBeInstanceOf(Temporal.Instant);

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
            "modifies": true,
            "name": "archiveEntity",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('createEntity', async () => {
    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      { logger: NoOpLogger },
      AdminClientOperationName.createEntity,
      async (_context, operation) => {
        const [entity, options] = operation.args;
        operation.resolve(
          ok({
            effect: options?.publish ? 'createdAndPublished' : 'created',
            entity: createDummyEntity({
              id: entity.id ?? '4321',
              info: {
                status: options?.publish ? AdminEntityStatus.published : AdminEntityStatus.draft,
              },
            }) as unknown as AdminEntity,
          })
        );
      }
    );

    const result = await adminClient.createEntity(
      {
        id: '1234',
        info: { name: 'Name', type: 'FooType', authKey: 'none' },
        fields: {},
      },
      { publish: true }
    );
    if (expectOkResult(result)) {
      expect(result.value.entity.info.createdAt).toBeInstanceOf(Temporal.Instant);
      expect(result.value.entity.info.updatedAt).toBeInstanceOf(Temporal.Instant);

      expect(result.value).toMatchInlineSnapshot(`
        {
          "effect": "createdAndPublished",
          "entity": {
            "fields": {
              "title": "Foo title",
            },
            "id": "1234",
            "info": {
              "authKey": "none",
              "createdAt": "2021-08-17T07:51:25.56Z",
              "name": "Foo name",
              "status": "published",
              "type": "FooType",
              "updatedAt": "2021-08-17T07:51:25.56Z",
              "version": 0,
            },
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
                "fields": {},
                "id": "1234",
                "info": {
                  "authKey": "none",
                  "name": "Name",
                  "type": "FooType",
                },
              },
              {
                "publish": true,
              },
            ],
            "modifies": true,
            "name": "createEntity",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('getEntities', async () => {
    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      { logger: NoOpLogger },
      AdminClientOperationName.getEntities,
      async (_context, operation) => {
        const [references] = operation.args;
        operation.resolve(
          ok(references.map(({ id }) => ok(createDummyEntity({ id }) as unknown as AdminEntity)))
        );
      }
    );

    const result = await adminClient.getEntities([{ id: '1234' }, { id: '5678' }]);
    if (expectOkResult(result)) {
      expect(result.value[0].isOk()).toBeTruthy();
      expect(result.value[1].isOk()).toBeTruthy();

      if (expectOkResult(result.value[0])) {
        expect(result.value[0].value.info.createdAt).toBeInstanceOf(Temporal.Instant);
        expect(result.value[0].value.info.updatedAt).toBeInstanceOf(Temporal.Instant);
      }

      expect(result.value).toMatchInlineSnapshot(`
        [
          OkResult {
            "value": {
              "fields": {
                "title": "Foo title",
              },
              "id": "1234",
              "info": {
                "authKey": "none",
                "createdAt": "2021-08-17T07:51:25.56Z",
                "name": "Foo name",
                "status": "draft",
                "type": "FooType",
                "updatedAt": "2021-08-17T07:51:25.56Z",
                "version": 0,
              },
            },
          },
          OkResult {
            "value": {
              "fields": {
                "title": "Foo title",
              },
              "id": "5678",
              "info": {
                "authKey": "none",
                "createdAt": "2021-08-17T07:51:25.56Z",
                "name": "Foo name",
                "status": "draft",
                "type": "FooType",
                "updatedAt": "2021-08-17T07:51:25.56Z",
                "version": 0,
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
    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      { logger: NoOpLogger },
      AdminClientOperationName.getEntity,
      async (_context, operation) => {
        const [reference] = operation.args;
        operation.resolve(ok(createDummyEntity({ id: reference.id }) as unknown as AdminEntity));
      }
    );

    const result = await adminClient.getEntity({ id: '1234' });
    if (expectOkResult(result)) {
      expect(result.value.info.createdAt).toBeInstanceOf(Temporal.Instant);
      expect(result.value.info.updatedAt).toBeInstanceOf(Temporal.Instant);

      expect(result.value).toMatchInlineSnapshot(`
        {
          "fields": {
            "title": "Foo title",
          },
          "id": "1234",
          "info": {
            "authKey": "none",
            "createdAt": "2021-08-17T07:51:25.56Z",
            "name": "Foo name",
            "status": "draft",
            "type": "FooType",
            "updatedAt": "2021-08-17T07:51:25.56Z",
            "version": 0,
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

  test('getEntityHistory', async () => {
    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      { logger: NoOpLogger },
      AdminClientOperationName.getEntityHistory,
      async (_context, operation) => {
        const [reference] = operation.args;
        operation.resolve(
          ok({
            id: reference.id,
            versions: [
              {
                createdAt: Temporal.Instant.from('2021-08-17T07:51:25.56Z'),
                createdBy: '123-456',
                version: 0,
                published: true,
              },
            ],
          })
        );
      }
    );

    const result = await adminClient.getEntityHistory({ id: '1234' });
    if (expectOkResult(result)) {
      expect(result.value.versions[0].createdAt).toBeInstanceOf(Temporal.Instant);

      expect(result.value).toMatchInlineSnapshot(`
        {
          "id": "1234",
          "versions": [
            {
              "createdAt": "2021-08-17T07:51:25.56Z",
              "createdBy": "123-456",
              "published": true,
              "version": 0,
            },
          ],
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
            "name": "getEntityHistory",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('getPublishingHistory', async () => {
    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      { logger: NoOpLogger },
      AdminClientOperationName.getPublishingHistory,
      async (_context, operation) => {
        const [reference] = operation.args;
        operation.resolve(
          ok({
            id: reference.id,
            events: [
              {
                kind: PublishingEventKind.publish,
                publishedAt: Temporal.Instant.from('2021-08-17T07:51:25.56Z'),
                publishedBy: '123-456',
                version: 0,
              },
            ],
          })
        );
      }
    );

    const result = await adminClient.getPublishingHistory({ id: '1234' });
    if (expectOkResult(result)) {
      expect(result.value.events[0].publishedAt).toBeInstanceOf(Temporal.Instant);

      expect(result.value).toMatchInlineSnapshot(`
        {
          "events": [
            {
              "kind": "publish",
              "publishedAt": "2021-08-17T07:51:25.56Z",
              "publishedBy": "123-456",
              "version": 0,
            },
          ],
          "id": "1234",
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
            "name": "getPublishingHistory",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('getSchemaSpecification', async () => {
    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      { logger: NoOpLogger },
      AdminClientOperationName.getSchemaSpecification,
      async (_context, operation) => {
        operation.resolve(ok({ entityTypes: [], valueTypes: [], patterns: [] }));
      }
    );

    const result = await adminClient.getSchemaSpecification();
    expectOkResult(result) &&
      expect(result.value).toMatchInlineSnapshot(`
        {
          "entityTypes": [],
          "patterns": [],
          "valueTypes": [],
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
    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      { logger: NoOpLogger },
      AdminClientOperationName.getTotalCount,
      async (_context, operation) => {
        const [_query] = operation.args;
        operation.resolve(ok(123));
      }
    );

    const result = await adminClient.getTotalCount({
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

  test('publishEntities', async () => {
    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      { logger: NoOpLogger },
      AdminClientOperationName.publishEntities,
      async (_context, operation) => {
        const [references] = operation.args;
        operation.resolve(
          ok(
            references.map((it) => ({
              id: it.id,
              status: AdminEntityStatus.published,
              effect: 'published',
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
        status: AdminEntityStatus.published,
        effect: 'published',
        updatedAt: Temporal.Instant.from('2021-08-17T08:51:25.56Z'),
      },
      {
        id: '4321',
        status: AdminEntityStatus.published,
        effect: 'published',
        updatedAt: Temporal.Instant.from('2021-08-17T08:51:25.56Z'),
      },
    ]);
    expectOkResult(result) && expect(result.value[0].updatedAt).toBeInstanceOf(Temporal.Instant);
    expectOkResult(result) && expect(result.value[1].updatedAt).toBeInstanceOf(Temporal.Instant);

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
                  "version": 0,
                },
                {
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

  test('releaseAdvisoryLock', async () => {
    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      { logger: NoOpLogger },
      AdminClientOperationName.releaseAdvisoryLock,
      async (_context, operation) => {
        const [name, _handle] = operation.args;
        operation.resolve(ok({ name }));
      }
    );

    const result = await adminClient.releaseAdvisoryLock('lock-name', 123);
    expectResultValue(result, { name: 'lock-name' });

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
              "lock-name",
              123,
            ],
            "modifies": true,
            "name": "releaseAdvisoryLock",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('renewAdvisoryLock', async () => {
    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      { logger: NoOpLogger },
      AdminClientOperationName.renewAdvisoryLock,
      async (_context, operation) => {
        const [name, handle] = operation.args;
        operation.resolve(ok({ name, handle }));
      }
    );

    const result = await adminClient.renewAdvisoryLock('lock-name', 123);
    expectResultValue(result, { name: 'lock-name', handle: 123 });

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
              "lock-name",
              123,
            ],
            "modifies": true,
            "name": "renewAdvisoryLock",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('sampleEntities', async () => {
    const entity1: AdminEntity = {
      id: 'id',
      info: {
        type: 'Foo',
        name: 'Name',
        version: 2,
        authKey: 'none',
        status: AdminEntityStatus.published,
        createdAt: Temporal.Instant.from('2021-08-17T08:51:25.56Z'),
        updatedAt: Temporal.Instant.from('2021-10-17T08:51:25.56Z'),
      },
      fields: { foo: 'Hello' },
    };

    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      { logger: NoOpLogger },
      AdminClientOperationName.sampleEntities,
      async (_context, operation) => {
        const [_query, options] = operation.args;
        operation.resolve(ok({ seed: options?.seed ?? 1, totalCount: 1, items: [entity1] }));
      }
    );

    const result = await adminClient.sampleEntities(
      { boundingBox: { minLat: 0, maxLat: 1, minLng: 20, maxLng: 21 } },
      { seed: 1234, count: 10 }
    );
    expectResultValue(result, { seed: 1234, totalCount: 1, items: [entity1] });

    if (expectOkResult(result)) {
      expect(result.value.items[0].info.createdAt).toBeInstanceOf(Temporal.Instant);
      expect(result.value.items[0].info.updatedAt).toBeInstanceOf(Temporal.Instant);
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
                "boundingBox": {
                  "maxLat": 1,
                  "maxLng": 21,
                  "minLat": 0,
                  "minLng": 20,
                },
              },
              {
                "count": 10,
                "seed": 1234,
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
    const entity1: AdminEntity = {
      id: 'id',
      info: {
        type: 'Foo',
        name: 'Name',
        version: 2,
        authKey: 'none',
        status: AdminEntityStatus.published,
        createdAt: Temporal.Instant.from('2021-08-17T08:51:25.56Z'),
        updatedAt: Temporal.Instant.from('2021-10-17T08:51:25.56Z'),
      },
      fields: { foo: 'Hello' },
    };

    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      { logger: NoOpLogger },
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
    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      { logger: NoOpLogger },
      AdminClientOperationName.searchEntities,
      async (_context, operation) => {
        const [_query, _paging] = operation.args;
        operation.resolve(ok(null));
      }
    );

    const result = await adminClient.searchEntities();
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

  test('unarchiveEntity', async () => {
    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      { logger: NoOpLogger },
      AdminClientOperationName.unarchiveEntity,
      async (_context, operation) => {
        const [reference] = operation.args;
        operation.resolve(
          ok({
            id: reference.id,
            status: AdminEntityStatus.withdrawn,
            effect: 'unarchived',
            updatedAt: Temporal.Instant.from('2021-08-17T08:51:25.56Z'),
          })
        );
      }
    );

    const result = await adminClient.unarchiveEntity({ id: '1234' });
    expectResultValue(result, {
      id: '1234',
      status: AdminEntityStatus.withdrawn,
      effect: 'unarchived',
      updatedAt: Temporal.Instant.from('2021-08-17T08:51:25.56Z'),
    });
    expectOkResult(result) && expect(result.value.updatedAt).toBeInstanceOf(Temporal.Instant);

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
      { logger: NoOpLogger },
      AdminClientOperationName.unpublishEntities,
      async (_context, operation) => {
        const [references] = operation.args;
        operation.resolve(
          ok(
            references.map((it) => ({
              id: it.id,
              status: AdminEntityStatus.withdrawn,
              effect: 'unpublished',
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
        status: AdminEntityStatus.withdrawn,
        effect: 'unpublished',
        updatedAt: Temporal.Instant.from('2021-08-17T08:51:25.56Z'),
      },
      {
        id: '4321',
        status: AdminEntityStatus.withdrawn,
        effect: 'unpublished',
        updatedAt: Temporal.Instant.from('2021-08-17T08:51:25.56Z'),
      },
    ]);
    expectOkResult(result) && expect(result.value[0].updatedAt).toBeInstanceOf(Temporal.Instant);
    expectOkResult(result) && expect(result.value[1].updatedAt).toBeInstanceOf(Temporal.Instant);

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

  test('updateEntity', async () => {
    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      { logger: NoOpLogger },
      AdminClientOperationName.updateEntity,
      async (_context, operation) => {
        const [entity, options] = operation.args;
        operation.resolve(
          ok({
            effect: options?.publish ? 'updatedAndPublished' : 'updated',
            entity: createDummyEntity({
              id: entity.id ?? '4321',
              info: {
                status: options?.publish ? AdminEntityStatus.published : AdminEntityStatus.draft,
              },
            }) as unknown as AdminEntity,
          })
        );
      }
    );

    const result = await adminClient.updateEntity(
      {
        id: '1234',
        fields: {},
      },
      { publish: true }
    );
    if (expectOkResult(result)) {
      expect(result.value.entity.info.createdAt).toBeInstanceOf(Temporal.Instant);
      expect(result.value.entity.info.updatedAt).toBeInstanceOf(Temporal.Instant);

      expect(result.value).toMatchInlineSnapshot(`
        {
          "effect": "updatedAndPublished",
          "entity": {
            "fields": {
              "title": "Foo title",
            },
            "id": "1234",
            "info": {
              "authKey": "none",
              "createdAt": "2021-08-17T07:51:25.56Z",
              "name": "Foo name",
              "status": "published",
              "type": "FooType",
              "updatedAt": "2021-08-17T07:51:25.56Z",
              "version": 0,
            },
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
                "fields": {},
                "id": "1234",
              },
              {
                "publish": true,
              },
            ],
            "modifies": true,
            "name": "updateEntity",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('updateSchemaSpecification', async () => {
    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      { logger: NoOpLogger },
      AdminClientOperationName.updateSchemaSpecification,
      async (_context, operation) => {
        operation.resolve(
          ok({
            effect: 'updated',
            schemaSpecification: { entityTypes: [], valueTypes: [], patterns: [] },
          })
        );
      }
    );

    const result = await adminClient.updateSchemaSpecification({ entityTypes: [], valueTypes: [] });
    expectOkResult(result) &&
      expect(result.value).toMatchInlineSnapshot(`
        {
          "effect": "updated",
          "schemaSpecification": {
            "entityTypes": [],
            "patterns": [],
            "valueTypes": [],
          },
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
            "args": [
              {
                "entityTypes": [],
                "valueTypes": [],
              },
            ],
            "modifies": true,
            "name": "updateSchemaSpecification",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('upsertEntity', async () => {
    const { adminClient, operationHandlerMock } = createJsonConvertingAdminClientsForOperation(
      { logger: NoOpLogger },
      AdminClientOperationName.upsertEntity,
      async (_context, operation) => {
        const [entity, options] = operation.args;
        operation.resolve(
          ok({
            effect: options?.publish ? 'created' : 'createdAndPublished',
            entity: createDummyEntity({
              id: entity.id ?? '4321',
              info: {
                status: options?.publish ? AdminEntityStatus.published : AdminEntityStatus.draft,
              },
            }) as unknown as AdminEntity,
          })
        );
      }
    );

    const result = await adminClient.upsertEntity(
      {
        id: '1234',
        info: { name: 'Name', type: 'FooType', authKey: 'none' },
        fields: {},
      },
      { publish: true }
    );
    if (expectOkResult(result)) {
      expect(result.value.entity.info.createdAt).toBeInstanceOf(Temporal.Instant);
      expect(result.value.entity.info.updatedAt).toBeInstanceOf(Temporal.Instant);

      expect(result.value).toMatchInlineSnapshot(`
        {
          "effect": "created",
          "entity": {
            "fields": {
              "title": "Foo title",
            },
            "id": "1234",
            "info": {
              "authKey": "none",
              "createdAt": "2021-08-17T07:51:25.56Z",
              "name": "Foo name",
              "status": "published",
              "type": "FooType",
              "updatedAt": "2021-08-17T07:51:25.56Z",
              "version": 0,
            },
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
                "fields": {},
                "id": "1234",
                "info": {
                  "authKey": "none",
                  "name": "Name",
                  "type": "FooType",
                },
              },
              {
                "publish": true,
              },
            ],
            "modifies": true,
            "name": "upsertEntity",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });
});
