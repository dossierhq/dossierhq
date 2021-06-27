import type { AdminClient, PublishedClient } from '@datadata/core';
import { CoreTestUtils, ErrorType, FieldType, EntityPublishState } from '@datadata/core';
import { createServerAdminClient, createServerPublishedClient } from '.';
import type { Server, SessionContext } from '.';
import { createTestServer, ensureSessionContext, updateSchema } from './ServerTestUtils';
import { expectResultValue } from '../test/AdditionalTestUtils';

const { expectErrorResult, expectOkResult } = CoreTestUtils;

let server: Server;
let context: SessionContext;
let adminClient: AdminClient;
let publishedClient: PublishedClient;

beforeAll(async () => {
  server = await createTestServer();
  context = await ensureSessionContext(server, 'test', 'published-entity');
  adminClient = createServerAdminClient({
    resolveContext: () => Promise.resolve(context),
  });
  publishedClient = createServerPublishedClient({ resolveContext: () => Promise.resolve(context) });

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
  test('Archived then published entity', async () => {
    const createResult = await adminClient.createEntity({
      _type: 'PublishedEntityFoo',
      _name: 'Foo 1',
      title: 'Title 1',
    });
    if (expectOkResult(createResult)) {
      const { id, _name: name, _version: version } = createResult.value;

      const archiveResult = await adminClient.archiveEntity({ id });
      expectResultValue(archiveResult, { id, publishState: EntityPublishState.Archived });

      const publishResult = await adminClient.publishEntities([{ id, version }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

      const result = await publishedClient.getEntity({ id });
      expectResultValue(result, {
        id,
        _type: 'PublishedEntityFoo',
        _name: name,
        title: 'Title 1',
      });
    }
  });

  test('Error: Archived entity', async () => {
    const createResult = await adminClient.createEntity({
      _type: 'PublishedEntityFoo',
      _name: 'Foo 1',
      title: 'Title 1',
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      const archiveResult = await adminClient.archiveEntity({ id });
      expectResultValue(archiveResult, { id, publishState: EntityPublishState.Archived });

      const result = await publishedClient.getEntity({ id });
      expectErrorResult(result, ErrorType.NotFound, 'No such entity');
    }
  });

  test('Error: Get missing id', async () => {
    const result = await publishedClient.getEntity({ id: 'f09fdd62-4a1e-4320-afba-8dd0781799df' });
    expectErrorResult(result, ErrorType.NotFound, 'No such entity');
  });
});

describe('getEntities()', () => {
  test('No ids', async () => {
    const result = await publishedClient.getEntities([]);
    expect(result).toHaveLength(0);
  });

  test('Get two entities', async () => {
    const createFoo1Result = await adminClient.createEntity({
      _type: 'PublishedEntityFoo',
      _name: 'Foo 1',
      title: 'Title 1',
    });
    const createFoo2Result = await adminClient.createEntity({
      _type: 'PublishedEntityFoo',
      _name: 'Foo 2',
      title: 'Title 2',
    });
    if (expectOkResult(createFoo1Result) && expectOkResult(createFoo2Result)) {
      const { id: foo1Id, _name: foo1Name } = createFoo1Result.value;
      const { id: foo2Id, _name: foo2Name } = createFoo2Result.value;

      const publishResult = await adminClient.publishEntities([
        { id: foo1Id, version: 0 },
        { id: foo2Id, version: 0 },
      ]);
      expectResultValue(publishResult, [
        { id: foo1Id, publishState: EntityPublishState.Published },
        { id: foo2Id, publishState: EntityPublishState.Published },
      ]);

      const result = await publishedClient.getEntities([{ id: foo2Id }, { id: foo1Id }]);
      expect(result).toHaveLength(2);
      expectResultValue(result[0], {
        _type: 'PublishedEntityFoo',
        id: foo2Id,
        _name: foo2Name,
        title: 'Title 2',
      });
      expectResultValue(result[1], {
        _type: 'PublishedEntityFoo',
        id: foo1Id,
        _name: foo1Name,
        title: 'Title 1',
      });
    }
  });

  test('Get one missing, one existing entity', async () => {
    const createFooResult = await adminClient.createEntity({
      _type: 'PublishedEntityFoo',
      _name: 'Foo',
      title: 'Title',
    });
    if (expectOkResult(createFooResult)) {
      const { id: foo1Id, _name: foo1Name } = createFooResult.value;

      const publishResult = await adminClient.publishEntities([{ id: foo1Id, version: 0 }]);
      expectResultValue(publishResult, [
        { id: foo1Id, publishState: EntityPublishState.Published },
      ]);

      const result = await publishedClient.getEntities([
        { id: 'f09fdd62-4a1e-4320-afba-8dd0781799df' },
        { id: foo1Id },
      ]);
      expect(result).toHaveLength(2);
      expectErrorResult(result[0], ErrorType.NotFound, 'No such entity');
      expectResultValue(result[1], {
        _type: 'PublishedEntityFoo',
        id: foo1Id,
        _name: foo1Name,
        title: 'Title',
      });
    }
  });

  test('Error: Get archived entity', async () => {
    const createResult = await adminClient.createEntity({
      _type: 'PublishedEntityFoo',
      _name: 'Foo 1',
      title: 'Title 1',
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      const archiveResult = await adminClient.archiveEntity({ id });
      expectResultValue(archiveResult, { id, publishState: EntityPublishState.Archived });

      const result = await publishedClient.getEntities([{ id }]);
      expect(result).toHaveLength(1);
      expectErrorResult(result[0], ErrorType.NotFound, 'No such entity');
    }
  });

  test('Error: Get missing ids', async () => {
    const result = await publishedClient.getEntities([
      { id: 'f09fdd62-4a1e-4320-afba-8dd0781799df' },
      { id: 'f09fdd62-4a1e-4320-4320-8dd0781799df' },
    ]);
    expect(result).toHaveLength(2);
    expectErrorResult(result[0], ErrorType.NotFound, 'No such entity');
    expectErrorResult(result[1], ErrorType.NotFound, 'No such entity');
  });
});
