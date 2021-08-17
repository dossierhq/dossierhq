import type { AdminClient, PublishedClient } from '@jonasb/datadata-core';
import { CoreTestUtils, ErrorType, FieldType, EntityPublishState } from '@jonasb/datadata-core';
import { createServerAdminClient, createServerPublishedClient } from '.';
import type { Server, SessionContext } from '.';
import { createTestServer, ensureSessionContext, updateSchema } from './ServerTestUtils';
import { expectResultValue } from './test/AdditionalTestUtils';

const { expectErrorResult, expectOkResult } = CoreTestUtils;

let server: Server;
let context: SessionContext;
let adminClient: AdminClient;
let publishedClient: PublishedClient;

beforeAll(async () => {
  server = await createTestServer();
  context = await ensureSessionContext(server, 'test', 'published-entity');
  adminClient = createServerAdminClient({ context });
  publishedClient = createServerPublishedClient({ context });

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
      info: { type: 'PublishedEntityFoo', name: 'Foo 1' },
      fields: { title: 'Title 1' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, version },
        },
      } = createResult.value;

      const archiveResult = await adminClient.archiveEntity({ id });
      if (expectOkResult(archiveResult)) {
        const { updatedAt } = archiveResult.value;
        expectResultValue(archiveResult, {
          id,
          publishState: EntityPublishState.Archived,
          updatedAt,
        });
      }

      const publishResult = await adminClient.publishEntities([{ id, version }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          { id, publishState: EntityPublishState.Published, updatedAt },
        ]);
      }

      const result = await publishedClient.getEntity({ id });
      expectResultValue(result, {
        id,
        info: { type: 'PublishedEntityFoo', name },
        fields: { title: 'Title 1' },
      });
    }
  });

  test('Error: Archived entity', async () => {
    const createResult = await adminClient.createEntity({
      info: { type: 'PublishedEntityFoo', name: 'Foo 1' },
      fields: { title: 'Title 1' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const archiveResult = await adminClient.archiveEntity({ id });
      if (expectOkResult(archiveResult)) {
        const { updatedAt } = archiveResult.value;
        expectResultValue(archiveResult, {
          id,
          publishState: EntityPublishState.Archived,
          updatedAt,
        });
      }

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
    if (expectOkResult(result)) {
      expect(result.value).toHaveLength(0);
    }
  });

  test('Get two entities', async () => {
    const createFoo1Result = await adminClient.createEntity({
      info: { type: 'PublishedEntityFoo', name: 'Foo 1' },
      fields: { title: 'Title 1' },
    });
    const createFoo2Result = await adminClient.createEntity({
      info: { type: 'PublishedEntityFoo', name: 'Foo 2' },
      fields: { title: 'Title 2' },
    });
    if (expectOkResult(createFoo1Result) && expectOkResult(createFoo2Result)) {
      const {
        entity: {
          id: foo1Id,
          info: { name: foo1Name },
        },
      } = createFoo1Result.value;
      const {
        entity: {
          id: foo2Id,
          info: { name: foo2Name },
        },
      } = createFoo2Result.value;

      const publishResult = await adminClient.publishEntities([
        { id: foo1Id, version: 0 },
        { id: foo2Id, version: 0 },
      ]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt: updatedAt1 }, { updatedAt: updatedAt2 }] = publishResult.value;
        expectResultValue(publishResult, [
          { id: foo1Id, publishState: EntityPublishState.Published, updatedAt: updatedAt1 },
          { id: foo2Id, publishState: EntityPublishState.Published, updatedAt: updatedAt2 },
        ]);
      }

      const result = await publishedClient.getEntities([{ id: foo2Id }, { id: foo1Id }]);
      if (expectOkResult(result)) {
        expect(result.value).toHaveLength(2);
        expectResultValue(result.value[0], {
          id: foo2Id,
          info: { type: 'PublishedEntityFoo', name: foo2Name },
          fields: { title: 'Title 2' },
        });
        expectResultValue(result.value[1], {
          id: foo1Id,
          info: { type: 'PublishedEntityFoo', name: foo1Name },
          fields: { title: 'Title 1' },
        });
      }
    }
  });

  test('Get one missing, one existing entity', async () => {
    const createFooResult = await adminClient.createEntity({
      info: { type: 'PublishedEntityFoo', name: 'Foo' },
      fields: { title: 'Title' },
    });
    if (expectOkResult(createFooResult)) {
      const {
        entity: {
          id: foo1Id,
          info: { name: foo1Name },
        },
      } = createFooResult.value;

      const publishResult = await adminClient.publishEntities([{ id: foo1Id, version: 0 }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          { id: foo1Id, publishState: EntityPublishState.Published, updatedAt },
        ]);
      }

      const result = await publishedClient.getEntities([
        { id: 'f09fdd62-4a1e-4320-afba-8dd0781799df' },
        { id: foo1Id },
      ]);
      if (expectOkResult(result)) {
        expect(result.value).toHaveLength(2);
        expectErrorResult(result.value[0], ErrorType.NotFound, 'No such entity');
        expectResultValue(result.value[1], {
          id: foo1Id,
          info: { type: 'PublishedEntityFoo', name: foo1Name },
          fields: {
            title: 'Title',
          },
        });
      }
    }
  });

  test('Error: Get archived entity', async () => {
    const createResult = await adminClient.createEntity({
      info: { type: 'PublishedEntityFoo', name: 'Foo 1' },
      fields: {
        title: 'Title 1',
      },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const archiveResult = await adminClient.archiveEntity({ id });
      if (expectOkResult(archiveResult)) {
        const { updatedAt } = archiveResult.value;
        expectResultValue(archiveResult, {
          id,
          publishState: EntityPublishState.Archived,
          updatedAt,
        });
      }

      const result = await publishedClient.getEntities([{ id }]);
      if (expectOkResult(result)) {
        expect(result.value).toHaveLength(1);
        expectErrorResult(result.value[0], ErrorType.NotFound, 'No such entity');
      }
    }
  });

  test('Error: Get missing ids', async () => {
    const result = await publishedClient.getEntities([
      { id: 'f09fdd62-4a1e-4320-afba-8dd0781799df' },
      { id: 'f09fdd62-4a1e-4320-4320-8dd0781799df' },
    ]);
    if (expectOkResult(result)) {
      expect(result.value).toHaveLength(2);
      expectErrorResult(result.value[0], ErrorType.NotFound, 'No such entity');
      expectErrorResult(result.value[1], ErrorType.NotFound, 'No such entity');
    }
  });
});
