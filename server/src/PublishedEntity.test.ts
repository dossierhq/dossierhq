import { CoreTestUtils, ErrorType, FieldType } from '@datadata/core';
import { EntityAdmin, PublishedEntity } from '.';
import type { Server, SessionContext } from '.';
import { createTestServer, ensureSessionContext, updateSchema } from './ServerTestUtils';

const { expectErrorResult, expectOkResult } = CoreTestUtils;

let server: Server;
let context: SessionContext;

beforeAll(async () => {
  server = await createTestServer();
  context = await ensureSessionContext(server, 'test', 'published-entity');
  await updateSchema(context, {
    entityTypes: [
      {
        name: 'PublishedEntityFoo',
        fields: [{ name: 'title', type: FieldType.String, isName: true }],
      },
    ],
  });
});
afterAll(async () => {
  await server.shutdown();
});

describe('getEntity()', () => {
  test('Error: Get missing id', async () => {
    const result = await PublishedEntity.getEntity(context, 'f09fdd62-4a1e-4320-afba-8dd0781799df');
    expectErrorResult(result, ErrorType.NotFound, 'No such entity');
  });
});

describe('getEntities()', () => {
  test('No ids', async () => {
    const result = await PublishedEntity.getEntities(context, []);
    expect(result).toHaveLength(0);
  });

  test('Get two entities', async () => {
    const createFoo1Result = await EntityAdmin.createEntity(
      context,
      { _type: 'PublishedEntityFoo', _name: 'Foo 1', title: 'Title 1' },
      { publish: true }
    );
    const createFoo2Result = await EntityAdmin.createEntity(
      context,
      { _type: 'PublishedEntityFoo', _name: 'Foo 2', title: 'Title 2' },
      { publish: true }
    );
    if (expectOkResult(createFoo1Result) && expectOkResult(createFoo2Result)) {
      const { id: foo1Id, _name: foo1Name } = createFoo1Result.value;
      const { id: foo2Id, _name: foo2Name } = createFoo2Result.value;

      const result = await PublishedEntity.getEntities(context, [foo2Id, foo1Id]);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        value: { _type: 'PublishedEntityFoo', id: foo2Id, _name: foo2Name, title: 'Title 2' },
      });
      expect(result[1]).toEqual({
        value: { _type: 'PublishedEntityFoo', id: foo1Id, _name: foo1Name, title: 'Title 1' },
      });
    }
  });

  test('Get one missing, one existing entity', async () => {
    const createFooResult = await EntityAdmin.createEntity(
      context,
      { _type: 'PublishedEntityFoo', _name: 'Foo', title: 'Title' },
      { publish: true }
    );
    if (expectOkResult(createFooResult)) {
      const { id: foo1Id, _name: foo1Name } = createFooResult.value;

      const result = await PublishedEntity.getEntities(context, [
        'f09fdd62-4a1e-4320-afba-8dd0781799df',
        foo1Id,
      ]);
      expect(result).toHaveLength(2);
      expectErrorResult(result[0], ErrorType.NotFound, 'No such entity');
      expect(result[1]).toEqual({
        value: { _type: 'PublishedEntityFoo', id: foo1Id, _name: foo1Name, title: 'Title' },
      });
    }
  });

  test('Error: Get missing ids', async () => {
    const result = await PublishedEntity.getEntities(context, [
      'f09fdd62-4a1e-4320-afba-8dd0781799df',
      'f09fdd62-4a1e-4320-4320-8dd0781799df',
    ]);
    expect(result).toHaveLength(2);
    expectErrorResult(result[0], ErrorType.NotFound, 'No such entity');
    expectErrorResult(result[1], ErrorType.NotFound, 'No such entity');
  });
});
