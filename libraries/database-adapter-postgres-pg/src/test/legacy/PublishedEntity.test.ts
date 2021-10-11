import type { AdminClient, AdminEntity, PublishedClient } from '@jonasb/datadata-core';
import { CoreTestUtils, EntityPublishState, ErrorType, FieldType } from '@jonasb/datadata-core';
import type { Server, SessionContext } from '@jonasb/datadata-server';
import { createPostgresTestServerAndClient, expectResultValue } from '../TestUtils';
import {
  ensureEntityCount,
  expectConnectionToMatchSlice,
  getAllEntities,
} from './EntitySearchTestUtils';

//TODO consider moving this test back to server or even to core

const SCHEMA = {
  entityTypes: [
    {
      name: 'PublishedEntityFoo',
      fields: [{ name: 'title', type: FieldType.String, isName: true }],
    },
    {
      name: 'PublishedEntityOnlyEditBefore',
      fields: [{ name: 'message', type: FieldType.String }],
    },
  ],
};

const { expectErrorResult, expectOkResult } = CoreTestUtils;

let server: Server;
let context: SessionContext;
let adminClient: AdminClient;
let publishedClient: PublishedClient;
let entitiesOfTypePublishedEntityOnlyEditBefore: AdminEntity[];

beforeAll(async () => {
  const result = await createPostgresTestServerAndClient();
  if (result.isError()) throw result.toError();
  server = result.value.server;
  context = result.value.context;
  adminClient = server.createAdminClient(context);
  publishedClient = server.createPublishedClient(context);

  await adminClient.updateSchemaSpecification(SCHEMA);

  await ensureEntitiesExistForPublishedEntityOnlyEditBefore(adminClient);
  entitiesOfTypePublishedEntityOnlyEditBefore = await getEntitiesForPublishedEntityOnlyEditBefore(
    adminClient
  );
});
afterAll(async () => {
  await server.shutdown();
});

async function ensureEntitiesExistForPublishedEntityOnlyEditBefore(client: AdminClient) {
  const result = await ensureEntityCount(client, 50, 'PublishedEntityOnlyEditBefore', (random) => ({
    message: `Hey ${random}`,
  }));
  result.throwIfError();
}

async function getEntitiesForPublishedEntityOnlyEditBefore(client: AdminClient) {
  //TODO add query support for entity status
  const result = await getAllEntities(client, { entityTypes: ['PublishedEntityOnlyEditBefore'] });
  if (result.isError()) {
    throw result.toError();
  }
  const publishedEntities = result.value.filter((it) =>
    [EntityPublishState.Published, EntityPublishState.Modified].includes(it.info.publishingState)
  );
  return publishedEntities;
}

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

describe('searchEntities()', () => {
  test('Default => first 25', async () => {
    const result = await publishedClient.searchEntities({
      entityTypes: ['PublishedEntityOnlyEditBefore'],
    });
    if (expectOkResult(result)) {
      expectConnectionToMatchSlice(
        entitiesOfTypePublishedEntityOnlyEditBefore,
        result.value,
        0,
        25
      );
    }
  });

  test('First', async () => {
    const result = await publishedClient.searchEntities(
      {
        entityTypes: ['PublishedEntityOnlyEditBefore'],
      },
      { first: 10 }
    );
    if (expectOkResult(result)) {
      expectConnectionToMatchSlice(
        entitiesOfTypePublishedEntityOnlyEditBefore,
        result.value,
        0,
        10
      );
    }
  });

  test('First 0', async () => {
    const result = await publishedClient.searchEntities(
      {
        entityTypes: ['PublishedEntityOnlyEditBefore'],
      },
      { first: 0 }
    );
    if (expectOkResult(result)) {
      expect(result.value).toBeNull();
    }
  });

  test('Last 0', async () => {
    const result = await publishedClient.searchEntities(
      {
        entityTypes: ['PublishedEntityOnlyEditBefore'],
      },
      { last: 0 }
    );
    if (expectOkResult(result)) {
      expect(result.value).toBeNull();
    }
  });

  test('Last', async () => {
    const result = await publishedClient.searchEntities(
      {
        entityTypes: ['PublishedEntityOnlyEditBefore'],
      },
      { last: 10 }
    );
    if (expectOkResult(result)) {
      expectConnectionToMatchSlice(
        entitiesOfTypePublishedEntityOnlyEditBefore,
        result.value,
        -10,
        undefined
      );
    }
  });

  test('First after', async () => {
    const firstResult = await publishedClient.searchEntities(
      {
        entityTypes: ['PublishedEntityOnlyEditBefore'],
      },
      { first: 10 }
    );
    if (expectOkResult(firstResult)) {
      const secondResult = await publishedClient.searchEntities(
        {
          entityTypes: ['PublishedEntityOnlyEditBefore'],
        },
        { first: 20, after: firstResult.value?.pageInfo.endCursor }
      );
      if (expectOkResult(secondResult)) {
        expectConnectionToMatchSlice(
          entitiesOfTypePublishedEntityOnlyEditBefore,
          secondResult.value,
          10,
          10 + 20
        );
      }
    }
  });

  test('Last before', async () => {
    const firstResult = await publishedClient.searchEntities(
      {
        entityTypes: ['PublishedEntityOnlyEditBefore'],
      },
      { last: 10 }
    );
    if (expectOkResult(firstResult)) {
      const secondResult = await publishedClient.searchEntities(
        {
          entityTypes: ['PublishedEntityOnlyEditBefore'],
        },
        { last: 20, before: firstResult.value?.pageInfo.startCursor }
      );
      if (expectOkResult(secondResult)) {
        expectConnectionToMatchSlice(
          entitiesOfTypePublishedEntityOnlyEditBefore,
          secondResult.value,
          -10 - 20,
          -10
        );
      }
    }
  });

  test('First between', async () => {
    const firstResult = await publishedClient.searchEntities(
      {
        entityTypes: ['PublishedEntityOnlyEditBefore'],
      },
      { first: 20 }
    );
    if (expectOkResult(firstResult)) {
      const secondResult = await publishedClient.searchEntities(
        {
          entityTypes: ['PublishedEntityOnlyEditBefore'],
        },
        {
          first: 20,
          after: firstResult.value?.edges[2].cursor,
          before: firstResult.value?.edges[8].cursor,
        }
      );
      if (expectOkResult(secondResult)) {
        expectConnectionToMatchSlice(
          entitiesOfTypePublishedEntityOnlyEditBefore,
          secondResult.value,
          3 /*inclusive*/,
          8 /*exclusive*/
        );
      }
    }
  });

  test('Last between', async () => {
    const firstResult = await publishedClient.searchEntities(
      {
        entityTypes: ['PublishedEntityOnlyEditBefore'],
      },
      { first: 20 }
    );
    if (expectOkResult(firstResult)) {
      const secondResult = await publishedClient.searchEntities(
        {
          entityTypes: ['PublishedEntityOnlyEditBefore'],
        },
        {
          last: 20,
          after: firstResult.value?.edges[2].cursor,
          before: firstResult.value?.edges[8].cursor,
        }
      );
      if (expectOkResult(secondResult)) {
        expectConnectionToMatchSlice(
          entitiesOfTypePublishedEntityOnlyEditBefore,
          secondResult.value,
          3 /*inclusive*/,
          8 /*exclusive*/
        );
      }
    }
  });
});
