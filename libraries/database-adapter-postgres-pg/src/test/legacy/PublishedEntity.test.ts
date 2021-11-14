import type {
  AdminClient,
  AdminEntity,
  AdminEntityCreate,
  AdminEntityCreatePayload,
  Entity,
  PromiseResult,
  PublishedClient,
  AdminSchemaSpecificationUpdate,
} from '@jonasb/datadata-core';
import {
  CoreTestUtils,
  EntityPublishState,
  ErrorType,
  FieldType,
  ok,
  QueryOrder,
  RichTextBlockType,
} from '@jonasb/datadata-core';
import type { Server, SessionContext } from '@jonasb/datadata-server';
import {
  createPostgresTestServerAndClient,
  expectResultValue,
  expectSearchResultEntities,
} from '../TestUtils';
import {
  countSearchResultWithEntity,
  ensureEntityCount,
  expectConnectionToMatchSlice,
  getAllEntities,
  randomBoundingBox,
} from './EntitySearchTestUtils';

//TODO consider moving this test back to server or even to core

const SCHEMA: AdminSchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'PublishedEntityFoo',
      fields: [
        { name: 'title', type: FieldType.String, isName: true },
        { name: 'location', type: FieldType.Location },
        { name: 'locations', type: FieldType.Location, list: true },
        { name: 'body', type: FieldType.RichText },
        { name: 'bar', type: FieldType.EntityType, entityTypes: ['PublishedEntityBar'] },
        {
          name: 'bars',
          type: FieldType.EntityType,
          entityTypes: ['PublishedEntityBar'],
          list: true,
        },
      ],
    },
    {
      name: 'PublishedEntityBar',
      fields: [
        { name: 'title', type: FieldType.String, isName: true },
        { name: 'entity', type: FieldType.EntityType },
      ],
    },
    {
      name: 'PublishedEntityOnlyEditBefore',
      fields: [{ name: 'message', type: FieldType.String }],
    },
  ],
  valueTypes: [
    {
      name: 'PublishedEntityStringedLocation',
      fields: [
        { name: 'string', type: FieldType.String },
        { name: 'location', type: FieldType.Location },
      ],
    },
  ],
};

const emptyFooFields = {
  bar: null,
  bars: null,
  body: null,
  location: null,
  locations: null,
  title: null,
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

async function createAndPublishEntities(
  adminClient: AdminClient,
  ...entities: AdminEntityCreate[]
): PromiseResult<
  AdminEntityCreatePayload[],
  ErrorType.BadRequest | ErrorType.Conflict | ErrorType.NotFound | ErrorType.Generic
> {
  //TODO use transaction when supported in client
  //TODO consider adding this kind of operation to AdminClient
  const result: AdminEntityCreatePayload[] = [];
  for (const entity of entities) {
    const createResult = await adminClient.createEntity(entity);
    if (createResult.isError()) {
      return createResult;
    }
    result.push(createResult.value);
  }

  const publishResult = await adminClient.publishEntities(
    result.map((it) => ({ id: it.entity.id, version: it.entity.info.version }))
  );
  if (publishResult.isError()) {
    return publishResult;
  }
  for (let i = 0; i < result.length; i += 1) {
    const entityInfo = result[i].entity.info;
    const { publishState, updatedAt } = publishResult.value[i];
    entityInfo.publishingState = publishState;
    entityInfo.updatedAt = updatedAt;
  }

  return ok(result);
}

async function createBarWithFooReferences(fooCount: number, referencesPerFoo = 1) {
  const createBarResult = await createAndPublishEntities(adminClient, {
    info: { type: 'PublishedEntityBar', name: 'Bar' },
    fields: { title: 'Bar' },
  });
  if (createBarResult.isError()) {
    throw createBarResult.toError();
  }

  const [
    {
      entity: { id: barId },
    },
  ] = createBarResult.value;

  const fooEntities: Entity[] = [];

  for (let i = 0; i < fooCount; i += 1) {
    const bars = [...new Array(referencesPerFoo - 1)].map(() => ({ id: barId }));
    const createFooResult = await createAndPublishEntities(adminClient, {
      info: { type: 'PublishedEntityFoo', name: 'Foo: ' + i },
      fields: { bar: { id: barId }, bars },
    });
    if (expectOkResult(createFooResult)) {
      const publishedEntityResult = await publishedClient.getEntity({
        id: createFooResult.value[0].entity.id,
      });
      if (expectOkResult(publishedEntityResult)) {
        fooEntities.push(publishedEntityResult.value);
      }
    }
  }
  return { barId, fooEntities };
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
        fields: { ...emptyFooFields, title: 'Title 1' },
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
          fields: { ...emptyFooFields, title: 'Title 2' },
        });
        expectResultValue(result.value[1], {
          id: foo1Id,
          info: { type: 'PublishedEntityFoo', name: foo1Name },
          fields: { ...emptyFooFields, title: 'Title 1' },
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
            ...emptyFooFields,
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

describe('searchEntities() paging', () => {
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

describe('searchEntities() order', () => {
  test('First default, ordered by createdAt', async () => {
    const result = await publishedClient.searchEntities(
      {
        entityTypes: ['PublishedEntityOnlyEditBefore'],
        order: QueryOrder.createdAt,
      },
      { first: 20 }
    );
    if (expectOkResult(result)) {
      expectConnectionToMatchSlice(
        entitiesOfTypePublishedEntityOnlyEditBefore,
        result.value,
        0,
        20
      );
    }
  });

  test('First default, ordered by name', async () => {
    const result = await publishedClient.searchEntities(
      {
        entityTypes: ['PublishedEntityOnlyEditBefore'],
        order: QueryOrder.name,
      },
      { first: 20 }
    );
    if (expectOkResult(result)) {
      expectConnectionToMatchSlice(
        entitiesOfTypePublishedEntityOnlyEditBefore,
        result.value,
        0,
        20,
        (a, b) => {
          return a.info.name < b.info.name ? -1 : 1;
        }
      );
    }
  });
});

describe('searchEntities() referencing', () => {
  test('One reference', async () => {
    const { barId, fooEntities } = await createBarWithFooReferences(1);
    const [fooEntity] = fooEntities;

    const searchResult = await publishedClient.searchEntities({ referencing: barId });
    expectSearchResultEntities(searchResult, [fooEntity]);
  });

  test('No references', async () => {
    const { barId } = await createBarWithFooReferences(0);

    const searchResult = await publishedClient.searchEntities({ referencing: barId });
    expectResultValue(searchResult, null);
  });

  test('Two references from one entity', async () => {
    const { barId, fooEntities } = await createBarWithFooReferences(1, 2);

    const searchResult = await publishedClient.searchEntities({ referencing: barId });
    expectSearchResultEntities(searchResult, fooEntities);
  });

  test('Two references, filter on entityType', async () => {
    const { barId, fooEntities } = await createBarWithFooReferences(1);

    const anotherBarCreateResult = await createAndPublishEntities(adminClient, {
      info: { type: 'PublishedEntityBar', name: 'Another Bar' },
      fields: { entity: { id: barId } },
    });
    if (expectOkResult(anotherBarCreateResult)) {
      const searchResult = await publishedClient.searchEntities({
        entityTypes: ['PublishedEntityFoo'],
        referencing: barId,
      });
      expectSearchResultEntities(searchResult, fooEntities);
    }
  });

  test('One reference, unpublished', async () => {
    const { barId, fooEntities } = await createBarWithFooReferences(1);

    const unpublishResult = await adminClient.unpublishEntities([{ id: fooEntities[0].id }]);
    expectOkResult(unpublishResult);

    const searchResult = await publishedClient.searchEntities({
      referencing: barId,
    });
    expectSearchResultEntities(searchResult, []);
  });
});

describe('searchEntities() boundingBox', () => {
  test('Query based on bounding box', async () => {
    const boundingBox = randomBoundingBox();
    const center = {
      lat: (boundingBox.minLat + boundingBox.maxLat) / 2,
      lng: (boundingBox.minLng + boundingBox.maxLng) / 2,
    };
    const createAndPublishResult = await createAndPublishEntities(adminClient, {
      info: { type: 'PublishedEntityFoo', name: 'Foo' },
      fields: { location: center },
    });

    if (expectOkResult(createAndPublishResult)) {
      const [
        {
          entity: { id },
        },
      ] = createAndPublishResult.value;

      const matches = await countSearchResultWithEntity(publishedClient, { boundingBox }, id);
      expectResultValue(matches, 1);
    }
  });

  test('Query based on bounding box (outside)', async () => {
    const boundingBox = randomBoundingBox();
    const outside = {
      lat: (boundingBox.minLat + boundingBox.maxLat) / 2,
      lng: boundingBox.minLng > 0 ? boundingBox.minLng - 1 : boundingBox.maxLng + 1,
    };
    const createAndPublishResult = await createAndPublishEntities(adminClient, {
      info: { type: 'PublishedEntityFoo', name: 'Foo' },
      fields: { location: outside },
    });

    if (expectOkResult(createAndPublishResult)) {
      const [
        {
          entity: { id },
        },
      ] = createAndPublishResult.value;
      const matches = await countSearchResultWithEntity(publishedClient, { boundingBox }, id);
      expectResultValue(matches, 0);
    }
  });

  test('Query based on bounding box with two locations inside', async () => {
    const boundingBox = randomBoundingBox();
    const center = {
      lat: (boundingBox.minLat + boundingBox.maxLat) / 2,
      lng: (boundingBox.minLng + boundingBox.maxLng) / 2,
    };
    const inside = {
      lat: center.lat,
      lng: (center.lng + boundingBox.maxLng) / 2,
    };

    const createAndPublishResult = await createAndPublishEntities(adminClient, {
      info: { type: 'PublishedEntityFoo', name: 'Foo' },
      fields: { locations: [center, inside] },
    });

    if (expectOkResult(createAndPublishResult)) {
      const [
        {
          entity: { id },
        },
      ] = createAndPublishResult.value;
      const matches = await countSearchResultWithEntity(publishedClient, { boundingBox }, id);
      expectResultValue(matches, 1);
    }
  });

  test('Query based on bounding box for rich text', async () => {
    const boundingBox = randomBoundingBox();
    const center = {
      lat: (boundingBox.minLat + boundingBox.maxLat) / 2,
      lng: (boundingBox.minLng + boundingBox.maxLng) / 2,
    };

    const createAndPublishResult = await createAndPublishEntities(adminClient, {
      info: { type: 'PublishedEntityFoo', name: 'Foo' },
      fields: {
        body: {
          blocks: [
            {
              type: RichTextBlockType.valueItem,
              data: {
                type: 'PublishedEntityStringedLocation',
                string: 'Hello location',
                location: center,
              },
            },
          ],
        },
      },
    });

    if (expectOkResult(createAndPublishResult)) {
      const [
        {
          entity: { id: bazId },
        },
      ] = createAndPublishResult.value;
      const matches = await countSearchResultWithEntity(publishedClient, { boundingBox }, bazId);
      expectResultValue(matches, 1);
    }
  });
});

describe('searchEntities() text', () => {
  test('Query based on text (after creation and updating)', async () => {
    const createResult = await createAndPublishEntities(adminClient, {
      info: { type: 'PublishedEntityFoo', name: 'Foo' },
      fields: { title: 'this is some serious summary with the best conclusion' },
    });
    if (expectOkResult(createResult)) {
      const [
        {
          entity: { id },
        },
      ] = createResult.value;

      const matches = await countSearchResultWithEntity(
        publishedClient,
        {
          entityTypes: ['PublishedEntityFoo'],
          text: 'serious conclusion',
        },
        id
      );
      expectResultValue(matches, 1);
    }
  });
});

describe('getTotalCount', () => {
  test('Check that we get the correct count', async () => {
    const result = await publishedClient.getTotalCount({
      entityTypes: ['AdminOnlyEditBefore'],
    });
    expectResultValue(result, entitiesOfTypePublishedEntityOnlyEditBefore.length);
  });

  test('Query based on referencing, one reference', async () => {
    const { barId } = await createBarWithFooReferences(1);

    const result = await publishedClient.getTotalCount({ referencing: barId });
    expectResultValue(result, 1);
  });

  test('Query based on referencing, no references', async () => {
    const { barId } = await createBarWithFooReferences(0);

    const result = await publishedClient.getTotalCount({ referencing: barId });
    expectResultValue(result, 0);
  });

  test('Query based on referencing and entityTypes, one reference', async () => {
    const { barId } = await createBarWithFooReferences(1, 1);

    const anotherBarCreateResult = await createAndPublishEntities(adminClient, {
      info: { type: 'PublishedEntityBar', name: 'Another Bar' },
      fields: { entity: { id: barId } },
    });
    if (expectOkResult(anotherBarCreateResult)) {
      const result = await publishedClient.getTotalCount({
        entityTypes: ['PublishedEntityFoo'],
        referencing: barId,
      });
      expectResultValue(result, 1);
    }
  });

  test('Query based on referencing, two references from one entity', async () => {
    const { barId } = await createBarWithFooReferences(1, 2);

    const result = await publishedClient.getTotalCount({ referencing: barId });
    expectResultValue(result, 1);
  });

  test('Query based on bounding box with two locations inside', async () => {
    const boundingBox = randomBoundingBox();
    const center = {
      lat: (boundingBox.minLat + boundingBox.maxLat) / 2,
      lng: (boundingBox.minLng + boundingBox.maxLng) / 2,
    };
    const inside = {
      lat: center.lat,
      lng: (center.lng + boundingBox.maxLng) / 2,
    };

    const createResult = await createAndPublishEntities(adminClient, {
      info: { type: 'PublishedEntityFoo', name: 'Foo' },
      fields: { locations: [center, inside] },
    });

    if (expectOkResult(createResult)) {
      const searchResult = await publishedClient.searchEntities({ boundingBox });

      const totalResult = await publishedClient.getTotalCount({ boundingBox });
      if (expectOkResult(searchResult) && expectOkResult(totalResult)) {
        // Hopefully there aren't too many entities in the bounding box
        expect(searchResult.value?.pageInfo.hasNextPage).toBeFalsy();

        expect(totalResult.value).toBe(searchResult.value?.edges.length);
      }
    }
  });

  test('Query based on text', async () => {
    const resultBefore = await publishedClient.getTotalCount({ text: 'sensational clown' });
    if (expectOkResult(resultBefore)) {
      expectOkResult(
        await createAndPublishEntities(adminClient, {
          info: { type: 'PublishedEntityFoo', name: 'Foo' },
          fields: { title: 'That was indeed a sensational clown' },
        })
      );

      const resultAfter = await publishedClient.getTotalCount({ text: 'sensational clown' });
      expectResultValue(resultAfter, resultBefore.value + 1);
    }
  });
});
