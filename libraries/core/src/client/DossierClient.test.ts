import { describe, expect, test, vi } from 'vitest';
import { assertOkResult, ok, type ErrorType } from '../ErrorResult.js';
import { NoOpLogger } from '../Logger.js';
import type {
  Entity,
  EntityCreate,
  EntityCreatePayload,
  EntityUpdate,
  EntityUpdatePayload,
  EntityUpsert,
  EntityUpsertPayload,
} from '../Types.js';
import { EntityStatus } from '../Types.js';
import { copyEntity } from '../content/ContentUtils.js';
import {
  EventType,
  type ChangelogEvent,
  type EntityChangelogEvent,
  type SchemaChangelogEvent,
} from '../events/EventTypes.js';
import { expectOkResult, expectResultValue } from '../test/CoreTestUtils.js';
import { assertIsDefined } from '../utils/Asserts.js';
import {
  DossierClientOperationName,
  convertJsonDossierClientResult,
  createBaseDossierClient,
  executeJsonDossierClientOperation,
  type DossierClient,
  type JsonDossierClientOperationArgs,
  type DossierClientMiddleware,
  type DossierClientOperation,
} from './DossierClient.js';
import { convertJsonResult } from './JsonUtils.js';
import type { ClientContext } from './SharedClient.js';

interface FooFields {
  title: string | null;
}
type FooEntity = Entity<'FooType', FooFields>;

function createForwardingMiddleware<TContext extends ClientContext>(
  client: DossierClient,
): DossierClientMiddleware<TContext> {
  return async function (_context, operation) {
    const operationArgsJson = JSON.parse(
      JSON.stringify(operation.args),
    ) as JsonDossierClientOperationArgs;
    // normally sent over HTTP
    const resultJson = await executeJsonDossierClientOperation(
      client,
      operation.name,
      operationArgsJson,
    );
    // normally returned over HTTP
    const convertedResultJson = convertJsonResult(
      JSON.parse(JSON.stringify(resultJson)) as typeof resultJson,
    );
    operation.resolve(convertJsonDossierClientResult(operation.name, convertedResultJson));
  };
}

function createJsonConvertingDossierClientsForOperation<
  TContext extends ClientContext,
  TName extends (typeof DossierClientOperationName)[keyof typeof DossierClientOperationName],
>(
  context: TContext,
  operationName: TName,
  operationHandlerMockImplementation: (
    context: TContext,
    operation: DossierClientOperation<TName>,
  ) => Promise<void>,
) {
  const operationHandlerMock = vi.fn<[TContext, DossierClientOperation<TName>], Promise<void>>();
  operationHandlerMock.mockImplementation(operationHandlerMockImplementation);

  const innerMiddleware: DossierClientMiddleware<TContext> = async (context, operation) => {
    expect(operation.name).toBe(operationName);
    await operationHandlerMock(context, operation as unknown as DossierClientOperation<TName>);
  };
  const innerClient = createBaseDossierClient<TContext>({
    context,
    pipeline: [innerMiddleware],
  });
  const outerClient = createBaseDossierClient<TContext>({
    context,
    pipeline: [createForwardingMiddleware(innerClient)],
  });
  return { client: outerClient, operationHandlerMock };
}

function createDummyEntity(changes: {
  id?: string;
  info?: Partial<FooEntity['info']>;
  fields?: Partial<FooEntity['fields']>;
}): FooEntity {
  return copyEntity<FooEntity>(
    {
      id: '123',
      info: {
        name: 'Foo name',
        type: 'FooType',
        version: 1,
        authKey: '',
        status: EntityStatus.draft,
        valid: true,
        validPublished: null,
        createdAt: new Date('2021-08-17T07:51:25.56Z'),
        updatedAt: new Date('2021-08-17T07:51:25.56Z'),
      },
      fields: { title: 'Foo title' },
    },
    changes,
  );
}

describe('Custom Entity types', () => {
  test('FooEntity creation', async () => {
    const client = createBaseDossierClient({
      context: { logger: NoOpLogger },
      pipeline: [],
    });

    const fooCreate: EntityCreate<FooEntity> = {
      info: { type: 'FooType', name: 'Foo name' },
      fields: { title: 'bar value' },
    };

    const _returnedPayload = await client.createEntity<FooEntity>(fooCreate);

    const fooCreatePayload: EntityCreatePayload<FooEntity> = {
      effect: 'created',
      entity: createDummyEntity({}),
    };
    const _fooEntity: FooEntity = fooCreatePayload.entity;
  });

  test('FooEntity update', async () => {
    const client = createBaseDossierClient({
      context: { logger: NoOpLogger },
      pipeline: [],
    });

    const fooUpdate: EntityUpdate<FooEntity> = {
      id: '123',
      info: { type: 'FooType', name: 'Foo name' },
      fields: { title: 'bar value' },
    };

    const _returnedPayload = await client.updateEntity<FooEntity>(fooUpdate);

    const fooUpdatePayload: EntityUpdatePayload<FooEntity> = {
      effect: 'updated',
      entity: createDummyEntity({}),
    };
    const _fooEntity: FooEntity = fooUpdatePayload.entity;
  });

  test('FooEntity upsert', async () => {
    const client = createBaseDossierClient({
      context: { logger: NoOpLogger },
      pipeline: [],
    });

    const fooUpsert: EntityUpsert<FooEntity> = {
      id: '123',
      info: { type: 'FooType', name: 'Foo name' },
      fields: { title: 'bar value' },
    };

    const _returnedPayload = await client.upsertEntity<FooEntity>(fooUpsert);

    const fooUpsertPayload: EntityUpsertPayload<FooEntity> = {
      effect: 'updated',
      entity: createDummyEntity({}),
    };
    const _fooEntity: FooEntity = fooUpsertPayload.entity;
  });
});

describe('DossierClient forward operation over JSON', () => {
  test('acquireAdvisoryLock', async () => {
    const { client, operationHandlerMock } = createJsonConvertingDossierClientsForOperation(
      { logger: NoOpLogger },
      DossierClientOperationName.acquireAdvisoryLock,
      (_context, operation) => {
        const [name, _options] = operation.args;
        operation.resolve(ok({ name, handle: 123 }));
        return Promise.resolve();
      },
    );

    const result = await client.acquireAdvisoryLock('lock-name', { leaseDuration: 100 });
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
    const { client, operationHandlerMock } = createJsonConvertingDossierClientsForOperation(
      { logger: NoOpLogger },
      DossierClientOperationName.archiveEntity,
      (_context, operation) => {
        const [reference] = operation.args;
        operation.resolve(
          ok({
            id: reference.id,
            status: EntityStatus.archived,
            effect: 'archived',
            updatedAt: new Date('2021-08-17T08:51:25.56Z'),
          }),
        );
        return Promise.resolve();
      },
    );

    const result = await client.archiveEntity({ id: '1234' });
    expectResultValue(result, {
      id: '1234',
      status: EntityStatus.archived,
      effect: 'archived',
      updatedAt: new Date('2021-08-17T08:51:25.56Z'),
    });
    expectOkResult(result) && expect(result.value.updatedAt).toBeInstanceOf(Date);

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
    const { client, operationHandlerMock } = createJsonConvertingDossierClientsForOperation(
      { logger: NoOpLogger },
      DossierClientOperationName.createEntity,
      (_context, operation) => {
        const [entity, options] = operation.args;
        operation.resolve(
          ok({
            effect: options?.publish ? 'createdAndPublished' : 'created',
            entity: createDummyEntity({
              id: entity.id ?? '4321',
              info: {
                status: options?.publish ? EntityStatus.published : EntityStatus.draft,
              },
            }) as unknown as Entity,
          }),
        );
        return Promise.resolve();
      },
    );

    const result = await client.createEntity(
      {
        id: '1234',
        info: { name: 'Name', type: 'FooType', authKey: '' },
        fields: {},
      },
      { publish: true },
    );
    if (expectOkResult(result)) {
      expect(result.value.entity.info.createdAt).toBeInstanceOf(Date);
      expect(result.value.entity.info.updatedAt).toBeInstanceOf(Date);

      expect(result.value).toMatchInlineSnapshot(`
        {
          "effect": "createdAndPublished",
          "entity": {
            "fields": {
              "title": "Foo title",
            },
            "id": "1234",
            "info": {
              "authKey": "",
              "createdAt": 2021-08-17T07:51:25.560Z,
              "name": "Foo name",
              "status": "published",
              "type": "FooType",
              "updatedAt": 2021-08-17T07:51:25.560Z,
              "valid": true,
              "validPublished": null,
              "version": 1,
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
                  "authKey": "",
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

  test('getChangelogEvents', async () => {
    const event1: SchemaChangelogEvent = {
      id: '1-2-3',
      type: EventType.updateSchema,
      createdBy: 'user',
      createdAt: new Date('2023-08-14T08:51:25.56Z'),
      version: 1,
    };
    const event2: EntityChangelogEvent = {
      id: '2-3-4',
      type: EventType.createEntity,
      createdBy: 'user',
      createdAt: new Date('2023-08-14T08:51:25.56Z'),
      entities: [{ id: '123', type: 'Foo', name: 'Hello', version: 1 }],
      unauthorizedEntityCount: 1,
    };

    const { client, operationHandlerMock } = createJsonConvertingDossierClientsForOperation(
      { logger: NoOpLogger },
      DossierClientOperationName.getChangelogEvents,
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
              { cursor: 'event-1', node: ok(event1) },
              { cursor: 'event-2', node: ok(event2) },
            ],
          }),
        );
        return Promise.resolve();
      },
    );

    const result = await client.getChangelogEvents(
      { types: [EventType.updateSchema, EventType.createEntity], reverse: true },
      { first: 10, after: 'cursor' },
    );
    assertOkResult(result);
    expectResultValue(result, {
      pageInfo: {
        hasPreviousPage: false,
        hasNextPage: true,
        startCursor: 'start-cursor',
        endCursor: 'end-cursor',
      },
      edges: [
        {
          cursor: 'event-1',
          node: ok<ChangelogEvent, typeof ErrorType.Generic>(event1),
        },
        {
          cursor: 'event-2',
          node: ok<ChangelogEvent, typeof ErrorType.Generic>(event2),
        },
      ],
    });
    expect(result.value?.edges[0].node.valueOrThrow().createdAt).toBeInstanceOf(Date);

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
                "reverse": true,
                "types": [
                  "updateSchema",
                  "createEntity",
                ],
              },
              {
                "after": "cursor",
                "first": 10,
              },
            ],
            "modifies": false,
            "name": "getChangelogEvents",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('getChangelogEventsTotalCount', async () => {
    const { client, operationHandlerMock } = createJsonConvertingDossierClientsForOperation(
      { logger: NoOpLogger },
      DossierClientOperationName.getChangelogEventsTotalCount,
      (_context, operation) => {
        const [_query] = operation.args;
        operation.resolve(ok(10));
        return Promise.resolve();
      },
    );

    const result = await client.getChangelogEventsTotalCount({
      types: [EventType.archiveEntity],
      reverse: true,
    });
    assertOkResult(result);
    expectResultValue(result, 10);

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
                "reverse": true,
                "types": [
                  "archiveEntity",
                ],
              },
            ],
            "modifies": false,
            "name": "getChangelogEventsTotalCount",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('getEntityList', async () => {
    const { client, operationHandlerMock } = createJsonConvertingDossierClientsForOperation(
      { logger: NoOpLogger },
      DossierClientOperationName.getEntityList,
      (_context, operation) => {
        const [references] = operation.args;
        operation.resolve(
          ok(references.map(({ id }) => ok(createDummyEntity({ id }) as unknown as Entity))),
        );
        return Promise.resolve();
      },
    );

    const result = await client.getEntityList([{ id: '1234' }, { id: '5678' }]);
    if (expectOkResult(result)) {
      expect(result.value[0].isOk()).toBeTruthy();
      expect(result.value[1].isOk()).toBeTruthy();

      if (expectOkResult(result.value[0])) {
        expect(result.value[0].value.info.createdAt).toBeInstanceOf(Date);
        expect(result.value[0].value.info.updatedAt).toBeInstanceOf(Date);
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
                "authKey": "",
                "createdAt": 2021-08-17T07:51:25.560Z,
                "name": "Foo name",
                "status": "draft",
                "type": "FooType",
                "updatedAt": 2021-08-17T07:51:25.560Z,
                "valid": true,
                "validPublished": null,
                "version": 1,
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
                "authKey": "",
                "createdAt": 2021-08-17T07:51:25.560Z,
                "name": "Foo name",
                "status": "draft",
                "type": "FooType",
                "updatedAt": 2021-08-17T07:51:25.560Z,
                "valid": true,
                "validPublished": null,
                "version": 1,
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
    const { client, operationHandlerMock } = createJsonConvertingDossierClientsForOperation(
      { logger: NoOpLogger },
      DossierClientOperationName.getEntity,
      (_context, operation) => {
        const [reference] = operation.args;
        operation.resolve(
          ok(
            createDummyEntity({
              id: 'id' in reference ? reference.id : `${reference.index}/${reference.value}`,
            }) as unknown as Entity,
          ),
        );
        return Promise.resolve();
      },
    );

    const result = await client.getEntity({ id: '1234' });
    if (expectOkResult(result)) {
      expect(result.value.info.createdAt).toBeInstanceOf(Date);
      expect(result.value.info.updatedAt).toBeInstanceOf(Date);

      expect(result.value).toMatchInlineSnapshot(`
        {
          "fields": {
            "title": "Foo title",
          },
          "id": "1234",
          "info": {
            "authKey": "",
            "createdAt": 2021-08-17T07:51:25.560Z,
            "name": "Foo name",
            "status": "draft",
            "type": "FooType",
            "updatedAt": 2021-08-17T07:51:25.560Z,
            "valid": true,
            "validPublished": null,
            "version": 1,
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
    const { client, operationHandlerMock } = createJsonConvertingDossierClientsForOperation(
      { logger: NoOpLogger },
      DossierClientOperationName.getSchemaSpecification,
      (_context, operation) => {
        operation.resolve(
          ok({
            schemaKind: 'full',
            version: 1,
            entityTypes: [],
            componentTypes: [],
            patterns: [],
            indexes: [],
          }),
        );
        return Promise.resolve();
      },
    );

    const result = await client.getSchemaSpecification();
    expectOkResult(result) &&
      expect(result.value).toMatchInlineSnapshot(`
        {
          "componentTypes": [],
          "entityTypes": [],
          "indexes": [],
          "patterns": [],
          "schemaKind": "full",
          "version": 1,
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
              null,
            ],
            "modifies": false,
            "name": "getSchemaSpecification",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('getSchemaSpecification includeMigrations', async () => {
    const { client, operationHandlerMock } = createJsonConvertingDossierClientsForOperation(
      { logger: NoOpLogger },
      DossierClientOperationName.getSchemaSpecification,
      (_context, operation) => {
        operation.resolve(
          ok({
            schemaKind: 'full',
            version: 1,
            migrations: [],
            entityTypes: [],
            componentTypes: [],
            patterns: [],
            indexes: [],
          }),
        );
        return Promise.resolve();
      },
    );

    const result = await client.getSchemaSpecification({ includeMigrations: true });
    expectOkResult(result) &&
      expect(result.value).toMatchInlineSnapshot(`
        {
          "componentTypes": [],
          "entityTypes": [],
          "indexes": [],
          "migrations": [],
          "patterns": [],
          "schemaKind": "full",
          "version": 1,
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
                "includeMigrations": true,
              },
            ],
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
    const { client, operationHandlerMock } = createJsonConvertingDossierClientsForOperation(
      { logger: NoOpLogger },
      DossierClientOperationName.getEntitiesTotalCount,
      (_context, operation) => {
        const [_query] = operation.args;
        operation.resolve(ok(123));
        return Promise.resolve();
      },
    );

    const result = await client.getEntitiesTotalCount({
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

  test('publishEntities', async () => {
    const { client, operationHandlerMock } = createJsonConvertingDossierClientsForOperation(
      { logger: NoOpLogger },
      DossierClientOperationName.publishEntities,
      (_context, operation) => {
        const [references] = operation.args;
        operation.resolve(
          ok(
            references.map((it) => ({
              id: it.id,
              status: EntityStatus.published,
              effect: 'published',
              updatedAt: new Date('2021-08-17T08:51:25.56Z'),
            })),
          ),
        );
        return Promise.resolve();
      },
    );

    const result = await client.publishEntities([
      { id: '1234', version: 1 },
      { id: '4321', version: 1 },
    ]);
    expectResultValue(result, [
      {
        id: '1234',
        status: EntityStatus.published,
        effect: 'published',
        updatedAt: new Date('2021-08-17T08:51:25.56Z'),
      },
      {
        id: '4321',
        status: EntityStatus.published,
        effect: 'published',
        updatedAt: new Date('2021-08-17T08:51:25.56Z'),
      },
    ]);
    expectOkResult(result) && expect(result.value[0].updatedAt).toBeInstanceOf(Date);
    expectOkResult(result) && expect(result.value[1].updatedAt).toBeInstanceOf(Date);

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
                  "version": 1,
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
    const { client, operationHandlerMock } = createJsonConvertingDossierClientsForOperation(
      { logger: NoOpLogger },
      DossierClientOperationName.releaseAdvisoryLock,
      (_context, operation) => {
        const [name, _handle] = operation.args;
        operation.resolve(ok({ name }));
        return Promise.resolve();
      },
    );

    const result = await client.releaseAdvisoryLock('lock-name', 123);
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
    const { client, operationHandlerMock } = createJsonConvertingDossierClientsForOperation(
      { logger: NoOpLogger },
      DossierClientOperationName.renewAdvisoryLock,
      (_context, operation) => {
        const [name, handle] = operation.args;
        operation.resolve(ok({ name, handle }));
        return Promise.resolve();
      },
    );

    const result = await client.renewAdvisoryLock('lock-name', 123);
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

  test('getEntitiesSample', async () => {
    const entity1: Entity = {
      id: 'id',
      info: {
        type: 'Foo',
        name: 'Name',
        version: 2,
        authKey: '',
        status: EntityStatus.published,
        valid: true,
        validPublished: true,
        createdAt: new Date('2021-08-17T08:51:25.56Z'),
        updatedAt: new Date('2021-10-17T08:51:25.56Z'),
      },
      fields: { foo: 'Hello' },
    };

    const { client, operationHandlerMock } = createJsonConvertingDossierClientsForOperation(
      { logger: NoOpLogger },
      DossierClientOperationName.getEntitiesSample,
      (_context, operation) => {
        const [_query, options] = operation.args;
        operation.resolve(ok({ seed: options?.seed ?? 1, totalCount: 1, items: [entity1] }));
        return Promise.resolve();
      },
    );

    const result = await client.getEntitiesSample(
      { boundingBox: { minLat: 0, maxLat: 1, minLng: 20, maxLng: 21 } },
      { seed: 1234, count: 10 },
    );
    expectResultValue(result, { seed: 1234, totalCount: 1, items: [entity1] });

    if (expectOkResult(result)) {
      expect(result.value.items[0].info.createdAt).toBeInstanceOf(Date);
      expect(result.value.items[0].info.updatedAt).toBeInstanceOf(Date);
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
            "name": "getEntitiesSample",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('getEntities', async () => {
    const entity1: Entity = {
      id: 'id',
      info: {
        type: 'Foo',
        name: 'Name',
        version: 2,
        authKey: '',
        status: EntityStatus.published,
        valid: true,
        validPublished: true,
        createdAt: new Date('2021-08-17T08:51:25.56Z'),
        updatedAt: new Date('2021-10-17T08:51:25.56Z'),
      },
      fields: { foo: 'Hello' },
    };

    const { client, operationHandlerMock } = createJsonConvertingDossierClientsForOperation(
      { logger: NoOpLogger },
      DossierClientOperationName.getEntities,
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

    const result = await client.getEntities(
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

    if (expectOkResult(result)) {
      const node = result.value?.edges[0].node;
      assertIsDefined(node);
      if (expectOkResult(node)) {
        expect(node.value.info.createdAt).toBeInstanceOf(Date);
        expect(node.value.info.updatedAt).toBeInstanceOf(Date);
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
            "name": "getEntities",
            "next": [Function],
            "resolve": [Function],
          },
        ],
      ]
    `);
  });

  test('getEntities (null)', async () => {
    const { client, operationHandlerMock } = createJsonConvertingDossierClientsForOperation(
      { logger: NoOpLogger },
      DossierClientOperationName.getEntities,
      (_context, operation) => {
        const [_query, _paging] = operation.args;
        operation.resolve(ok(null));
        return Promise.resolve();
      },
    );

    const result = await client.getEntities();
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

  test('unarchiveEntity', async () => {
    const { client, operationHandlerMock } = createJsonConvertingDossierClientsForOperation(
      { logger: NoOpLogger },
      DossierClientOperationName.unarchiveEntity,
      (_context, operation) => {
        const [reference] = operation.args;
        operation.resolve(
          ok({
            id: reference.id,
            status: EntityStatus.withdrawn,
            effect: 'unarchived',
            updatedAt: new Date('2021-08-17T08:51:25.56Z'),
          }),
        );
        return Promise.resolve();
      },
    );

    const result = await client.unarchiveEntity({ id: '1234' });
    expectResultValue(result, {
      id: '1234',
      status: EntityStatus.withdrawn,
      effect: 'unarchived',
      updatedAt: new Date('2021-08-17T08:51:25.56Z'),
    });
    expectOkResult(result) && expect(result.value.updatedAt).toBeInstanceOf(Date);

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
    const { client, operationHandlerMock } = createJsonConvertingDossierClientsForOperation(
      { logger: NoOpLogger },
      DossierClientOperationName.unpublishEntities,
      (_context, operation) => {
        const [references] = operation.args;
        operation.resolve(
          ok(
            references.map((it) => ({
              id: it.id,
              status: EntityStatus.withdrawn,
              effect: 'unpublished',
              updatedAt: new Date('2021-08-17T08:51:25.56Z'),
            })),
          ),
        );
        return Promise.resolve();
      },
    );

    const result = await client.unpublishEntities([{ id: '1234' }, { id: '4321' }]);
    expectResultValue(result, [
      {
        id: '1234',
        status: EntityStatus.withdrawn,
        effect: 'unpublished',
        updatedAt: new Date('2021-08-17T08:51:25.56Z'),
      },
      {
        id: '4321',
        status: EntityStatus.withdrawn,
        effect: 'unpublished',
        updatedAt: new Date('2021-08-17T08:51:25.56Z'),
      },
    ]);
    expectOkResult(result) && expect(result.value[0].updatedAt).toBeInstanceOf(Date);
    expectOkResult(result) && expect(result.value[1].updatedAt).toBeInstanceOf(Date);

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
    const { client, operationHandlerMock } = createJsonConvertingDossierClientsForOperation(
      { logger: NoOpLogger },
      DossierClientOperationName.updateEntity,
      (_context, operation) => {
        const [entity, options] = operation.args;
        operation.resolve(
          ok({
            effect: options?.publish ? 'updatedAndPublished' : 'updated',
            entity: createDummyEntity({
              id: entity.id ?? '4321',
              info: {
                status: options?.publish ? EntityStatus.published : EntityStatus.draft,
              },
            }) as unknown as Entity,
          }),
        );
        return Promise.resolve();
      },
    );

    const result = await client.updateEntity(
      {
        id: '1234',
        fields: {},
      },
      { publish: true },
    );
    if (expectOkResult(result)) {
      expect(result.value.entity.info.createdAt).toBeInstanceOf(Date);
      expect(result.value.entity.info.updatedAt).toBeInstanceOf(Date);

      expect(result.value).toMatchInlineSnapshot(`
        {
          "effect": "updatedAndPublished",
          "entity": {
            "fields": {
              "title": "Foo title",
            },
            "id": "1234",
            "info": {
              "authKey": "",
              "createdAt": 2021-08-17T07:51:25.560Z,
              "name": "Foo name",
              "status": "published",
              "type": "FooType",
              "updatedAt": 2021-08-17T07:51:25.560Z,
              "valid": true,
              "validPublished": null,
              "version": 1,
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
    const { client, operationHandlerMock } = createJsonConvertingDossierClientsForOperation(
      { logger: NoOpLogger },
      DossierClientOperationName.updateSchemaSpecification,
      (_context, operation) => {
        operation.resolve(
          ok({
            effect: 'updated',
            schemaSpecification: {
              schemaKind: 'full',
              version: 2,
              entityTypes: [],
              componentTypes: [],
              patterns: [],
              indexes: [],
            },
          }),
        );
        return Promise.resolve();
      },
    );

    const result = await client.updateSchemaSpecification({
      entityTypes: [],
      componentTypes: [],
    });
    expectOkResult(result) &&
      expect(result.value).toMatchInlineSnapshot(`
        {
          "effect": "updated",
          "schemaSpecification": {
            "componentTypes": [],
            "entityTypes": [],
            "indexes": [],
            "patterns": [],
            "schemaKind": "full",
            "version": 2,
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
                "componentTypes": [],
                "entityTypes": [],
              },
              null,
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

  test('updateSchemaSpecification includeMigrations', async () => {
    const { client, operationHandlerMock } = createJsonConvertingDossierClientsForOperation(
      { logger: NoOpLogger },
      DossierClientOperationName.updateSchemaSpecification,
      (_context, operation) => {
        operation.resolve(
          ok({
            effect: 'updated',
            schemaSpecification: {
              schemaKind: 'full',
              version: 2,
              entityTypes: [],
              componentTypes: [],
              patterns: [],
              indexes: [],
              migrations: [],
            },
          }),
        );
        return Promise.resolve();
      },
    );

    const result = await client.updateSchemaSpecification(
      { entityTypes: [], componentTypes: [] },
      { includeMigrations: true },
    );
    expectOkResult(result) &&
      expect(result.value).toMatchInlineSnapshot(`
        {
          "effect": "updated",
          "schemaSpecification": {
            "componentTypes": [],
            "entityTypes": [],
            "indexes": [],
            "migrations": [],
            "patterns": [],
            "schemaKind": "full",
            "version": 2,
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
                "componentTypes": [],
                "entityTypes": [],
              },
              {
                "includeMigrations": true,
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
    const { client, operationHandlerMock } = createJsonConvertingDossierClientsForOperation(
      { logger: NoOpLogger },
      DossierClientOperationName.upsertEntity,
      (_context, operation) => {
        const [entity, options] = operation.args;
        operation.resolve(
          ok({
            effect: options?.publish ? 'created' : 'createdAndPublished',
            entity: createDummyEntity({
              id: entity.id ?? '4321',
              info: {
                status: options?.publish ? EntityStatus.published : EntityStatus.draft,
              },
            }) as unknown as Entity,
          }),
        );
        return Promise.resolve();
      },
    );

    const result = await client.upsertEntity(
      {
        id: '1234',
        info: { name: 'Name', type: 'FooType', authKey: '' },
        fields: {},
      },
      { publish: true },
    );
    if (expectOkResult(result)) {
      expect(result.value.entity.info.createdAt).toBeInstanceOf(Date);
      expect(result.value.entity.info.updatedAt).toBeInstanceOf(Date);

      expect(result.value).toMatchInlineSnapshot(`
        {
          "effect": "created",
          "entity": {
            "fields": {
              "title": "Foo title",
            },
            "id": "1234",
            "info": {
              "authKey": "",
              "createdAt": 2021-08-17T07:51:25.560Z,
              "name": "Foo name",
              "status": "published",
              "type": "FooType",
              "updatedAt": 2021-08-17T07:51:25.560Z,
              "valid": true,
              "validPublished": null,
              "version": 1,
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
                  "authKey": "",
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
