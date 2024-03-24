import type {
  AdminClient,
  AdminEntity,
  AdminSchemaSpecificationUpdate,
  PublishedClient,
  PublishedEntity,
} from '@dossierhq/core';
import {
  AdminEntityStatus,
  FieldType,
  assertOkResult,
  createRichText,
  createRichTextComponentNode,
} from '@dossierhq/core';
import { expectOkResult, expectResultValue } from '@dossierhq/core-vitest';
import type { Server, SessionContext } from '@dossierhq/server';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
  createPostgresTestServerAndClient,
  expectSearchResultEntities,
  safelyUpdateSchemaSpecification,
} from '../TestUtils.js';
import {
  countSearchResultWithEntity,
  ensureEntityCount,
  expectConnectionToMatchSlice,
  getAllEntities,
  randomBoundingBox,
} from './EntitySearchTestUtils.js';

//TODO consider moving this test back to server or even to core

const SCHEMA: AdminSchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'PublishedEntityFoo',
      nameField: 'title',
      fields: [
        { name: 'title', type: FieldType.String },
        { name: 'location', type: FieldType.Location },
        { name: 'locations', type: FieldType.Location, list: true },
        { name: 'body', type: FieldType.RichText },
        { name: 'bar', type: FieldType.Entity, entityTypes: ['PublishedEntityBar'] },
        {
          name: 'bars',
          type: FieldType.Entity,
          entityTypes: ['PublishedEntityBar'],
          list: true,
        },
      ],
    },
    {
      name: 'PublishedEntityBar',
      nameField: 'title',
      fields: [
        { name: 'title', type: FieldType.String },
        { name: 'entity', type: FieldType.Entity },
      ],
    },
    {
      name: 'PublishedEntityOnlyEditBefore',
      fields: [{ name: 'message', type: FieldType.String }],
    },
  ],
  componentTypes: [
    {
      name: 'PublishedEntityStringedLocation',
      fields: [
        { name: 'string', type: FieldType.String },
        { name: 'location', type: FieldType.Location },
      ],
    },
  ],
};

let server: Server;
let context: SessionContext;
let adminClient: AdminClient;
let publishedClient: PublishedClient;
let entitiesOfTypePublishedEntityOnlyEditBeforeNone: AdminEntity[];

beforeAll(async () => {
  const result = await createPostgresTestServerAndClient();
  assertOkResult(result);
  server = result.value.server;
  context = result.value.context;
  adminClient = server.createAdminClient(context);
  publishedClient = server.createPublishedClient(context);

  (await safelyUpdateSchemaSpecification(adminClient, SCHEMA)).throwIfError();
  await ensureEntitiesExistForPublishedEntityOnlyEditBefore(adminClient, '');
  entitiesOfTypePublishedEntityOnlyEditBeforeNone =
    await getEntitiesForPublishedEntityOnlyEditBefore(adminClient, '');
});
afterAll(async () => {
  await server.shutdown();
});

async function ensureEntitiesExistForPublishedEntityOnlyEditBefore(
  client: AdminClient,
  authKey: string,
) {
  const result = await ensureEntityCount(
    client,
    50,
    'PublishedEntityOnlyEditBefore',
    authKey,
    (random) => ({
      message: `Hey ${random}`,
    }),
  );
  result.throwIfError();
}

async function getEntitiesForPublishedEntityOnlyEditBefore(client: AdminClient, authKey: string) {
  const result = await getAllEntities(client, {
    authKeys: [authKey],
    entityTypes: ['PublishedEntityOnlyEditBefore'],
    status: [AdminEntityStatus.published, AdminEntityStatus.modified],
  });
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}

async function createBarWithFooReferences(fooCount: number, referencesPerFoo = 1) {
  const createBarResult = await adminClient.createEntity(
    {
      info: { type: 'PublishedEntityBar', name: 'Bar' },
      fields: { title: 'Bar' },
    },
    { publish: true },
  );
  if (createBarResult.isError()) {
    throw createBarResult.toError();
  }

  const {
    entity: { id: barId },
  } = createBarResult.value;

  const fooEntities: PublishedEntity[] = [];

  for (let i = 0; i < fooCount; i += 1) {
    const bars = [...new Array<undefined>(referencesPerFoo - 1)].map(() => ({ id: barId }));
    const createFooResult = await adminClient.createEntity(
      {
        info: { type: 'PublishedEntityFoo', name: 'Foo: ' + i },
        fields: { bar: { id: barId }, bars },
      },
      { publish: true },
    );
    if (expectOkResult(createFooResult)) {
      const publishedEntityResult = await publishedClient.getEntity({
        id: createFooResult.value.entity.id,
      });
      if (expectOkResult(publishedEntityResult)) {
        fooEntities.push(publishedEntityResult.value);
      }
    }
  }
  return { barId, fooEntities };
}

describe('getEntities() paging', () => {
  test('Reversed: First after', async () => {
    const query = {
      entityTypes: ['PublishedEntityOnlyEditBefore'],
      reverse: true,
    };
    const firstResult = await publishedClient.getEntities(query, { first: 10 });
    if (expectOkResult(firstResult)) {
      const secondResult = await publishedClient.getEntities(query, {
        first: 20,
        after: firstResult.value?.pageInfo.endCursor,
      });
      if (expectOkResult(secondResult)) {
        expectConnectionToMatchSlice(
          [...entitiesOfTypePublishedEntityOnlyEditBeforeNone].reverse(),
          secondResult.value,
          10,
          10 + 20,
        );
      }
    }
  });
});

describe('getEntities() linksTo', () => {
  test('One reference', async () => {
    const { barId, fooEntities } = await createBarWithFooReferences(1);
    const [fooEntity] = fooEntities;

    const searchResult = await publishedClient.getEntities({ linksTo: { id: barId } });
    expectSearchResultEntities(searchResult, [fooEntity]);
  });

  test('No references', async () => {
    const { barId } = await createBarWithFooReferences(0);

    const searchResult = await publishedClient.getEntities({ linksTo: { id: barId } });
    expectResultValue(searchResult, null);
  });

  test('Two references from one entity', async () => {
    const { barId, fooEntities } = await createBarWithFooReferences(1, 2);

    const searchResult = await publishedClient.getEntities({ linksTo: { id: barId } });
    expectSearchResultEntities(searchResult, fooEntities);
  });

  test('Two references, filter on entityType', async () => {
    const { barId, fooEntities } = await createBarWithFooReferences(1);

    const anotherBarCreateResult = await adminClient.createEntity(
      {
        info: { type: 'PublishedEntityBar', name: 'Another Bar' },
        fields: { entity: { id: barId } },
      },
      { publish: true },
    );
    if (expectOkResult(anotherBarCreateResult)) {
      const searchResult = await publishedClient.getEntities({
        entityTypes: ['PublishedEntityFoo'],
        linksTo: { id: barId },
      });
      expectSearchResultEntities(searchResult, fooEntities);
    }
  });

  test('One reference, unpublished', async () => {
    const { barId, fooEntities } = await createBarWithFooReferences(1);

    const unpublishResult = await adminClient.unpublishEntities([{ id: fooEntities[0].id }]);
    expectOkResult(unpublishResult);

    const searchResult = await publishedClient.getEntities({
      linksTo: { id: barId },
    });
    expectSearchResultEntities(searchResult, []);
  });
});

describe('getEntities() boundingBox', () => {
  test('Query based on bounding box', async () => {
    const boundingBox = randomBoundingBox();
    const center = {
      lat: (boundingBox.minLat + boundingBox.maxLat) / 2,
      lng: (boundingBox.minLng + boundingBox.maxLng) / 2,
    };
    const createAndPublishResult = await adminClient.createEntity(
      {
        info: { type: 'PublishedEntityFoo', name: 'Foo' },
        fields: { location: center },
      },
      { publish: true },
    );

    if (expectOkResult(createAndPublishResult)) {
      const {
        entity: { id },
      } = createAndPublishResult.value;

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
    const createAndPublishResult = await adminClient.createEntity(
      {
        info: { type: 'PublishedEntityFoo', name: 'Foo', authKey: '' },
        fields: { location: outside },
      },
      { publish: true },
    );

    if (expectOkResult(createAndPublishResult)) {
      const {
        entity: { id },
      } = createAndPublishResult.value;
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

    const createAndPublishResult = await adminClient.createEntity(
      {
        info: { type: 'PublishedEntityFoo', name: 'Foo' },
        fields: { locations: [center, inside] },
      },
      { publish: true },
    );

    if (expectOkResult(createAndPublishResult)) {
      const {
        entity: { id },
      } = createAndPublishResult.value;
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

    const createAndPublishResult = await adminClient.createEntity(
      {
        info: { type: 'PublishedEntityFoo', name: 'Foo' },
        fields: {
          body: createRichText([
            createRichTextComponentNode({
              type: 'PublishedEntityStringedLocation',
              string: 'Hello location',
              location: center,
            }),
          ]),
        },
      },
      { publish: true },
    );

    if (expectOkResult(createAndPublishResult)) {
      const {
        entity: { id: bazId },
      } = createAndPublishResult.value;
      const matches = await countSearchResultWithEntity(publishedClient, { boundingBox }, bazId);
      expectResultValue(matches, 1);
    }
  });
});

describe('getEntities() text', () => {
  test('Query based on text (after creation and updating)', async () => {
    const createResult = await adminClient.createEntity(
      {
        info: { type: 'PublishedEntityFoo', name: 'Foo' },
        fields: { title: 'this is some serious summary with the best conclusion' },
      },
      { publish: true },
    );
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const matches = await countSearchResultWithEntity(
        publishedClient,
        {
          entityTypes: ['PublishedEntityFoo'],
          text: 'serious conclusion',
        },
        id,
      );
      expectResultValue(matches, 1);
    }
  });
});

describe('getEntitiesTotalCount', () => {
  test('Query based on linksTo, one reference', async () => {
    const { barId } = await createBarWithFooReferences(1);

    const result = await publishedClient.getEntitiesTotalCount({ linksTo: { id: barId } });
    expectResultValue(result, 1);
  });

  test('Query based on linksTo, no references', async () => {
    const { barId } = await createBarWithFooReferences(0);

    const result = await publishedClient.getEntitiesTotalCount({ linksTo: { id: barId } });
    expectResultValue(result, 0);
  });

  test('Query based on linksTo and entityTypes, one reference', async () => {
    const { barId } = await createBarWithFooReferences(1, 1);

    const anotherBarCreateResult = await adminClient.createEntity(
      {
        info: { type: 'PublishedEntityBar', name: 'Another Bar' },
        fields: { entity: { id: barId } },
      },
      { publish: true },
    );
    if (expectOkResult(anotherBarCreateResult)) {
      const result = await publishedClient.getEntitiesTotalCount({
        entityTypes: ['PublishedEntityFoo'],
        linksTo: { id: barId },
      });
      expectResultValue(result, 1);
    }
  });

  test('Query based on linksTo, two references from one entity', async () => {
    const { barId } = await createBarWithFooReferences(1, 2);

    const result = await publishedClient.getEntitiesTotalCount({ linksTo: { id: barId } });
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

    const createResult = await adminClient.createEntity(
      {
        info: { type: 'PublishedEntityFoo', name: 'Foo' },
        fields: { locations: [center, inside] },
      },
      { publish: true },
    );

    if (expectOkResult(createResult)) {
      const searchResult = await publishedClient.getEntities({ boundingBox });

      const totalResult = await publishedClient.getEntitiesTotalCount({ boundingBox });
      if (expectOkResult(searchResult) && expectOkResult(totalResult)) {
        // Hopefully there aren't too many entities in the bounding box
        expect(searchResult.value?.pageInfo.hasNextPage).toBeFalsy();

        expect(totalResult.value).toBe(searchResult.value?.edges.length);
      }
    }
  });

  test('Query based on text', async () => {
    const resultBefore = await publishedClient.getEntitiesTotalCount({
      text: 'fierce firefighter',
    });
    if (expectOkResult(resultBefore)) {
      expectOkResult(
        await adminClient.createEntity(
          {
            info: { type: 'PublishedEntityFoo', name: 'Foo' },
            fields: { title: 'That was indeed a fierce firefighter' },
          },
          { publish: true },
        ),
      );

      const resultAfter = await publishedClient.getEntitiesTotalCount({
        text: 'fierce firefighter',
      });
      expectResultValue(resultAfter, resultBefore.value + 1);
    }
  });
});
