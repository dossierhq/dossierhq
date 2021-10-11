import type {
  AdminClient,
  AdminEntity,
  AdminQuery,
  BoundingBox,
  Connection,
  Edge,
  PublishedClient,
} from '@jonasb/datadata-core';
import {
  copyEntity,
  CoreTestUtils,
  EntityPublishState,
  ErrorType,
  FieldType,
  getAllPagesForConnection,
  PublishingEventKind,
  QueryOrder,
  RichTextBlockType,
} from '@jonasb/datadata-core';
import type { Server, SessionContext } from '@jonasb/datadata-server';
import { validate as validateUuid } from 'uuid';
import {
  createPostgresTestServerAndClient,
  expectEntityHistoryVersions,
  expectResultValue,
  expectSearchResultEntities,
  insecureTestUuidv4,
} from '../TestUtils';

const { expectErrorResult, expectOkResult } = CoreTestUtils;

let server: Server;
let context: SessionContext;
let client: AdminClient;
let publishedClient: PublishedClient;
let entitiesOfTypeAdminOnlyEditBefore: AdminEntity[];

const emptyFooFields = { bar: null, summary: null, title: null };
const emptyBazFields = {
  active: null,
  activeList: null,
  bar: null,
  bars: null,
  baz: null,
  body: null,
  bodyList: null,
  bodyOnlyParagraph: null,
  booleanString: null,
  listFields: null,
  listFieldsList: null,
  location: null,
  locations: null,
  nested: null,
  oneString: null,
  stringReference: null,
  tags: null,
  title: null,
  twoStrings: null,
  twoStringsList: null,
};

beforeAll(async () => {
  const result = await createPostgresTestServerAndClient();
  if (result.isError()) throw result.toError();
  server = result.value.server;
  context = result.value.context;
  client = server.createAdminClient(context);
  publishedClient = server.createPublishedClient(context);
  await client.updateSchemaSpecification({
    entityTypes: [
      {
        name: 'EntityAdminFoo',
        fields: [
          { name: 'title', type: FieldType.String, isName: true },
          { name: 'summary', type: FieldType.String },
          { name: 'bar', type: FieldType.EntityType, entityTypes: ['EntityAdminBar'] },
        ],
      },
      { name: 'EntityAdminBar', fields: [{ name: 'title', type: FieldType.String }] },
      {
        name: 'EntityAdminBaz',
        fields: [
          { name: 'title', type: FieldType.String },
          { name: 'bar', type: FieldType.EntityType, entityTypes: ['EntityAdminBar'] },
          { name: 'baz', type: FieldType.EntityType, entityTypes: ['EntityAdminBaz'] },
          { name: 'tags', type: FieldType.String, list: true },
          { name: 'active', type: FieldType.Boolean },
          { name: 'activeList', type: FieldType.Boolean, list: true },
          { name: 'body', type: FieldType.RichText },
          {
            name: 'bodyOnlyParagraph',
            type: FieldType.RichText,
            richTextBlocks: [{ type: RichTextBlockType.paragraph }],
          },
          { name: 'bodyList', type: FieldType.RichText, list: true },
          { name: 'location', type: FieldType.Location },
          { name: 'locations', type: FieldType.Location, list: true },
          {
            name: 'bars',
            type: FieldType.EntityType,
            list: true,
            entityTypes: ['EntityAdminBar'],
          },
          {
            name: 'oneString',
            type: FieldType.ValueType,
            valueTypes: ['EntityAdminOneString'],
          },
          {
            name: 'twoStrings',
            type: FieldType.ValueType,
            valueTypes: ['EntityAdminTwoStrings'],
          },
          {
            name: 'twoStringsList',
            type: FieldType.ValueType,
            valueTypes: ['EntityAdminTwoStrings'],
            list: true,
          },
          {
            name: 'booleanString',
            type: FieldType.ValueType,
            valueTypes: ['EntityAdminBooleanString'],
          },
          {
            name: 'stringReference',
            type: FieldType.ValueType,
            valueTypes: ['EntityAdminStringReference'],
          },
          {
            name: 'listFields',
            type: FieldType.ValueType,
            valueTypes: ['EntityAdminListFields'],
          },
          {
            name: 'listFieldsList',
            type: FieldType.ValueType,
            list: true,
            valueTypes: ['EntityAdminListFields'],
          },
          {
            name: 'nested',
            type: FieldType.ValueType,
            valueTypes: ['EntityAdminNested'],
          },
        ],
      },
      { name: 'AdminOnlyEditBefore', fields: [{ name: 'message', type: FieldType.String }] },
    ],
    valueTypes: [
      {
        name: 'EntityAdminOneString',
        fields: [{ name: 'one', type: FieldType.String }],
      },
      {
        name: 'EntityAdminTwoStrings',
        fields: [
          { name: 'one', type: FieldType.String },
          { name: 'two', type: FieldType.String },
        ],
      },
      {
        name: 'EntityAdminBooleanString',
        fields: [
          { name: 'boolean', type: FieldType.Boolean },
          { name: 'string', type: FieldType.String },
        ],
      },
      {
        name: 'EntityAdminStringReference',
        fields: [
          { name: 'string', type: FieldType.String },
          { name: 'reference', type: FieldType.EntityType, entityTypes: ['EntityAdminBar'] },
        ],
      },
      {
        name: 'EntityAdminListFields',
        fields: [
          { name: 'stringList', type: FieldType.String, list: true },
          {
            name: 'referenceList',
            type: FieldType.EntityType,
            list: true,
            entityTypes: ['EntityAdminBar'],
          },
        ],
      },
      {
        name: 'EntityAdminStringedLocation',
        fields: [
          { name: 'string', type: FieldType.String },
          {
            name: 'location',
            type: FieldType.Location,
          },
        ],
      },
      {
        name: 'EntityAdminNested',
        fields: [
          { name: 'title', type: FieldType.String },
          {
            name: 'child',
            type: FieldType.ValueType,
            valueTypes: ['EntityAdminNested'],
          },
        ],
      },
    ],
  });

  await ensureEntitiesExistForAdminOnlyEditBefore(client);
  const knownIds = await getEntitiesForAdminOnlyEditBefore(client);
  entitiesOfTypeAdminOnlyEditBefore = knownIds.entities;
});
afterAll(async () => {
  await server.shutdown();
});

async function ensureEntitiesExistForAdminOnlyEditBefore(client: AdminClient) {
  const requestedCount = 50;
  const entitiesOfTypeCount = await client.getTotalCount({
    entityTypes: ['AdminOnlyEditBefore'],
  });

  if (expectOkResult(entitiesOfTypeCount)) {
    for (let count = entitiesOfTypeCount.value; count < requestedCount; count += 1) {
      const random = String(Math.random()).slice(2);
      const createResult = await client.createEntity({
        info: { type: 'AdminOnlyEditBefore', name: random },
        fields: { message: `Hey ${random}` },
      });
      if (expectOkResult(createResult)) {
        const {
          entity: {
            id,
            info: { version },
          },
        } = createResult.value;
        const publishResult = await client.publishEntities([{ id, version }]);
        publishResult.throwIfError();
      }
    }
  }
}

async function getEntitiesForAdminOnlyEditBefore(client: AdminClient) {
  const query = { entityTypes: ['AdminOnlyEditBefore'] };
  const entities: AdminEntity[] = [];
  for await (const pageResult of getAllPagesForConnection({ first: 100 }, (currentPaging) =>
    client.searchEntities(query, currentPaging)
  )) {
    if (pageResult.isError()) {
      throw pageResult.toError();
    }

    for (const edge of pageResult.value.edges) {
      if (edge.node.isOk()) {
        const entity = edge.node.value;
        entities.push(entity);
      }
    }
  }
  return { entities };
}

async function countSearchResultWithEntity(query: AdminQuery, entityId: string) {
  let matchCount = 0;

  for await (const pageResult of getAllPagesForConnection({ first: 50 }, (currentPaging) =>
    client.searchEntities(query, currentPaging)
  )) {
    if (pageResult.isError()) {
      throw pageResult.toError();
    }
    for (const edge of pageResult.value.edges) {
      if (edge.node.isOk() && edge.node.value.id === entityId) {
        matchCount += 1;
      }
    }
  }

  return matchCount;
}

async function createBarWithFooBazReferences(
  fooCount: number,
  bazCount: number,
  bazReferencesPerEntity = 1
) {
  const createBarResult = await client.createEntity({
    info: { type: 'EntityAdminBar', name: 'Bar' },
    fields: { title: 'Bar' },
  });
  if (createBarResult.isError()) {
    throw createBarResult.toError();
  }

  const {
    entity: { id: barId },
  } = createBarResult.value;

  const fooEntities: AdminEntity[] = [];
  const bazEntities: AdminEntity[] = [];

  for (let i = 0; i < fooCount; i += 1) {
    const createFooResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo: ' + i },
      fields: { bar: { id: barId } },
    });
    if (expectOkResult(createFooResult)) {
      fooEntities.push(createFooResult.value.entity);
    }
  }
  for (let i = 0; i < bazCount; i += 1) {
    const bars = [...new Array(bazReferencesPerEntity - 1)].map(() => ({ id: barId }));
    const createBazResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz: ' + i },
      fields: { bar: { id: barId }, bars },
    });
    if (expectOkResult(createBazResult)) {
      bazEntities.push(createBazResult.value.entity);
    }
  }
  return { barId, fooEntities, bazEntities };
}

/** Random bounding box (which doesn't wrap 180/-180 longitude) */
function randomBoundingBox(heightLat = 1.0, widthLng = 1.0): BoundingBox {
  function randomInRange(min: number, max: number) {
    return min + Math.random() * (max - min);
  }

  const minLat = randomInRange(-90, 90 - heightLat);
  const minLng = randomInRange(-180, 180 - widthLng);
  const maxLat = minLat + heightLat;
  const maxLng = minLng + widthLng;
  return { minLat, maxLat, minLng, maxLng };
}

describe('getEntity()', () => {
  // rest is tested elsewhere

  test('No version means max version', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo' },
      fields: { title: 'Title' },
    });

    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt },
        },
      } = createResult.value;
      const updateResult = await client.updateEntity({ id, fields: { title: 'Updated title' } });
      if (expectOkResult(updateResult)) {
        const {
          entity: {
            info: { updatedAt },
          },
        } = updateResult.value;

        const versionMaxResult = await client.getEntity({ id });
        expectResultValue(versionMaxResult, {
          id,
          info: {
            type: 'EntityAdminFoo',
            name,
            version: 1,
            publishingState: EntityPublishState.Draft,
            createdAt,
            updatedAt,
          },
          fields: { ...emptyFooFields, title: 'Updated title' },
        });
      }
    }
  });

  test('Error: Get entity with invalid id', async () => {
    const result = await client.getEntity({ id: '13e4c7da-616e-44a3-a039-24f96f9b17da' });
    expectErrorResult(result, ErrorType.NotFound, 'No such entity');
  });

  test('Error: Get entity with invalid version', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo' },
      fields: { title: 'Title' },
    });

    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const resultMinusOne = await client.getEntity({ id, version: -1 });
      expectErrorResult(resultMinusOne, ErrorType.NotFound, 'No such entity or version');

      const resultOne = await client.getEntity({ id, version: 1 });
      expectErrorResult(resultOne, ErrorType.NotFound, 'No such entity or version');
    }
  });
});

describe('getEntities()', () => {
  test('Get no entities', async () => {
    const result = await client.getEntities([]);
    if (expectOkResult(result)) {
      expect(result.value).toHaveLength(0);
    }
  });

  test('Get 2 entities', async () => {
    const createFoo1Result = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo' },
      fields: { title: 'Title 1' },
    });
    const createFoo2Result = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo' },
      fields: { title: 'Title 2' },
    });

    if (expectOkResult(createFoo1Result) && expectOkResult(createFoo2Result)) {
      const {
        entity: {
          id: foo1Id,
          info: { name: foo1Name, createdAt: createdAt1, updatedAt: updatedAt1 },
        },
      } = createFoo1Result.value;
      const {
        entity: {
          id: foo2Id,
          info: { name: foo2Name, createdAt: createdAt2, updatedAt: updatedAt2 },
        },
      } = createFoo2Result.value;

      const result = await client.getEntities([{ id: foo2Id }, { id: foo1Id }]);
      if (expectOkResult(result)) {
        expect(result.value).toHaveLength(2);
        expectResultValue(result.value[0], {
          id: foo2Id,
          info: {
            type: 'EntityAdminFoo',
            name: foo2Name,
            version: 0,
            publishingState: EntityPublishState.Draft,
            createdAt: createdAt2,
            updatedAt: updatedAt2,
          },
          fields: { ...emptyFooFields, title: 'Title 2' },
        });
        expectResultValue(result.value[1], {
          id: foo1Id,
          info: {
            type: 'EntityAdminFoo',
            name: foo1Name,
            version: 0,
            publishingState: EntityPublishState.Draft,
            createdAt: createdAt1,
            updatedAt: updatedAt1,
          },
          fields: { ...emptyFooFields, title: 'Title 1' },
        });
      }
    }
  });

  test('Gets the last version', async () => {
    const createFooResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo' },
      fields: { title: 'First title' },
    });

    if (expectOkResult(createFooResult)) {
      const {
        entity: {
          id: fooId,
          info: { name: fooName, createdAt },
        },
      } = createFooResult.value;

      const updateResult = await client.updateEntity({
        id: fooId,
        fields: { title: 'Updated title' },
      });
      if (expectOkResult(updateResult)) {
        const {
          entity: {
            info: { updatedAt },
          },
        } = updateResult.value;

        const result = await client.getEntities([{ id: fooId }]);
        if (expectOkResult(result)) {
          expect(result.value).toHaveLength(1);
          expectResultValue(result.value[0], {
            id: fooId,
            info: {
              type: 'EntityAdminFoo',
              name: fooName,
              version: 1,
              publishingState: EntityPublishState.Draft,
              createdAt,
              updatedAt,
            },
            fields: { ...emptyFooFields, title: 'Updated title' },
          });
        }
      }
    }
  });

  test('Error: Get entities with invalid ids', async () => {
    const result = await client.getEntities([
      { id: '13e4c7da-616e-44a3-a039-24f96f9b17da' },
      { id: '13e4c7da-616e-44a3-44a3-24f96f9b17da' },
    ]);
    if (expectOkResult(result)) {
      expect(result.value).toHaveLength(2);
      expectErrorResult(result.value[0], ErrorType.NotFound, 'No such entity');
      expectErrorResult(result.value[1], ErrorType.NotFound, 'No such entity');
    }
  });
});

describe('createEntity()', () => {
  test('Create EntityAdminFoo and publish', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo' },
      fields: { title: 'Title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;
      expect(validateUuid(id)).toBeTruthy();
      expect(name).toMatch(/^Foo(#[0-9]+)?$/);

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminFoo',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
          createdAt,
          updatedAt,
        },
        fields: { ...emptyFooFields, title: 'Title' },
      };

      expectResultValue(createResult, { effect: 'created', entity: expectedEntity });

      const publishResult = await client.publishEntities([{ id, version: 0 }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          { id, publishState: EntityPublishState.Published, updatedAt },
        ]);

        expectedEntity.info.publishingState = EntityPublishState.Published;
        expectedEntity.info.updatedAt = updatedAt;
      }

      const historyResult = await client.getEntityHistory({ id });
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            published: true,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await client.getEntity({ id, version: 0 });
      expectResultValue(version0Result, expectedEntity);

      const publishedResult = await publishedClient.getEntity({ id });
      expectResultValue(publishedResult, {
        id,
        info: { type: 'EntityAdminFoo', name },
        fields: { ...emptyFooFields, title: 'Title' },
      });
    }
  });

  test('Create EntityAdminFoo w/o publish', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Draft' },
      fields: { title: 'Draft' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;
      expect(validateUuid(id)).toBeTruthy();

      expectResultValue(createResult, {
        effect: 'created',
        entity: {
          id,
          info: {
            type: 'EntityAdminFoo',
            name,
            version: 0,
            publishingState: EntityPublishState.Draft,
            createdAt,
            updatedAt,
          },
          fields: { ...emptyFooFields, title: 'Draft' },
        },
      });

      const historyResult = await client.getEntityHistory({ id });
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            published: false,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await client.getEntity({ id, version: 0 });
      expectResultValue(version0Result, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
          createdAt,
          updatedAt,
        },
        fields: { ...emptyFooFields, title: 'Draft' },
      });

      const publishedResult = await publishedClient.getEntity({ id });
      expectErrorResult(publishedResult, ErrorType.NotFound, 'No such entity');
    }
  });

  test('Create EntityAdminFoo with id', async () => {
    const id = insecureTestUuidv4();
    const createResult = await client.createEntity({
      id,
      info: { type: 'EntityAdminFoo', name: 'Draft' },
      fields: { title: 'Draft' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;
      expectResultValue(createResult, {
        effect: 'created',
        entity: {
          id,
          info: {
            type: 'EntityAdminFoo',
            name,
            version: 0,
            publishingState: EntityPublishState.Draft,
            createdAt,
            updatedAt,
          },
          fields: { ...emptyFooFields, title: 'Draft' },
        },
      });
    }
  });

  test('Create EntityAdminFoo normalizes empty string', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Draft' },
      fields: { title: '' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          fields: { title },
        },
      } = createResult.value;
      expect(title).toBe(null);
    }
  });

  test('Create EntityAdminFoo normalizes empty value item', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Draft' },
      fields: { twoStrings: { type: 'EntityAdminTwoStrings' } },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          version: 0,
          name,
          publishingState: EntityPublishState.Draft,
          createdAt,
          updatedAt,
        },
        fields: {
          ...emptyBazFields,
          twoStrings: { type: 'EntityAdminTwoStrings', one: null, two: null },
        },
      };

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  });

  test('Create EntityAdminFoo with reference to Bar', async () => {
    const createBarResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createBarResult)) {
      const {
        entity: { id: barId },
      } = createBarResult.value;

      const createFooResult = await client.createEntity({
        info: { type: 'EntityAdminFoo', name: 'Foo name' },
        fields: { title: 'Foo title', bar: { id: barId } },
      });
      if (expectOkResult(createFooResult)) {
        const {
          entity: {
            id: fooId,
            info: { name, createdAt, updatedAt },
          },
        } = createFooResult.value;
        expect(validateUuid(fooId)).toBeTruthy();

        const expectedFooEntity: AdminEntity = {
          id: fooId,
          info: {
            type: 'EntityAdminFoo',
            name,
            version: 0,
            publishingState: EntityPublishState.Draft,
            createdAt,
            updatedAt,
          },
          fields: {
            ...emptyFooFields,
            title: 'Foo title',
            bar: { id: barId },
          },
        };

        expectResultValue(createFooResult, {
          effect: 'created',
          entity: expectedFooEntity,
        });

        const publishResult = await client.publishEntities([
          { id: fooId, version: 0 },
          { id: barId, version: 0 },
        ]);
        if (expectOkResult(publishResult)) {
          const [{ updatedAt: fooUpdatedAt }, { updatedAt: barUpdatedAt }] = publishResult.value;
          expectResultValue(publishResult, [
            { id: fooId, publishState: EntityPublishState.Published, updatedAt: fooUpdatedAt },
            { id: barId, publishState: EntityPublishState.Published, updatedAt: barUpdatedAt },
          ]);

          expectedFooEntity.info.publishingState = EntityPublishState.Published;
          expectedFooEntity.info.updatedAt = fooUpdatedAt;
        }

        const fooVersion0Result = await client.getEntity({ id: fooId, version: 0 });
        expectResultValue(fooVersion0Result, expectedFooEntity);

        const publishedFooResult = await publishedClient.getEntity({ id: fooId });
        expectResultValue(publishedFooResult, {
          id: fooId,
          info: { type: 'EntityAdminFoo', name },
          fields: {
            ...emptyFooFields,
            title: 'Foo title',
            bar: { id: barId },
          },
        });
      }
    }
  });

  test('Create EntityAdminBaz with string list', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: { tags: ['one', 'two', 'three'] },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
          createdAt,
          updatedAt,
        },
        fields: { ...emptyBazFields, tags: ['one', 'two', 'three'] },
      };

      expectResultValue(createResult, {
        effect: 'created',
        entity: expectedEntity,
      });

      const getResult = await client.getEntity({ id });
      if (expectOkResult(getResult)) {
        expectResultValue(getResult, expectedEntity);
      }
    }
  });

  test('Create EntityAdminBaz with boolean and boolean list', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: { active: true, activeList: [true, false, true] },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
          createdAt,
          updatedAt,
        },
        fields: { ...emptyBazFields, active: true, activeList: [true, false, true] },
      };

      expectResultValue(createResult, {
        effect: 'created',
        entity: expectedEntity,
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  });

  test('Create EntityAdminBaz with rich text and rich text list', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        body: { blocks: [{ type: 'paragraph', data: { text: 'Hello world' } }] },
        bodyList: [
          { blocks: [{ type: 'paragraph', data: { text: 'First rich text' } }] },
          { blocks: [{ type: 'paragraph', data: { text: 'Second rich text' } }] },
        ],
      },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
          createdAt,
          updatedAt,
        },
        fields: {
          ...emptyBazFields,
          body: { blocks: [{ type: 'paragraph', data: { text: 'Hello world' } }] },
          bodyList: [
            { blocks: [{ type: 'paragraph', data: { text: 'First rich text' } }] },
            { blocks: [{ type: 'paragraph', data: { text: 'Second rich text' } }] },
          ],
        },
      };

      expectResultValue(createResult, {
        effect: 'created',
        entity: expectedEntity,
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  });

  test('Create EntityAdminBaz with rich text with value item and entity references', async () => {
    const createBar1Result = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar 1' },
      fields: {},
    });
    const createBar2Result = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar 2' },
      fields: {},
    });
    if (expectOkResult(createBar1Result) && expectOkResult(createBar2Result)) {
      const {
        entity: { id: bar1Id },
      } = createBar1Result.value;
      const {
        entity: { id: bar2Id },
      } = createBar2Result.value;

      const createBazResult = await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'Baz' },
        fields: {
          body: {
            blocks: [
              { type: RichTextBlockType.entity, data: { id: bar1Id } },
              { type: RichTextBlockType.entity, data: null },
              {
                type: RichTextBlockType.valueItem,
                data: {
                  type: 'EntityAdminStringReference',
                  string: 'Hello bar 2',
                  reference: { id: bar2Id },
                },
              },
              {
                type: RichTextBlockType.valueItem,
                data: null,
              },
            ],
          },
        },
      });
      if (expectOkResult(createBazResult)) {
        const { entity: baz } = createBazResult.value;
        const {
          entity: {
            id: bazId,
            info: { name: bazName, createdAt, updatedAt },
          },
        } = createBazResult.value;

        const expectedBazEntity: AdminEntity = {
          id: bazId,
          info: {
            type: 'EntityAdminBaz',
            name: bazName,
            version: 0,
            publishingState: EntityPublishState.Draft,
            createdAt,
            updatedAt,
          },
          fields: {
            ...emptyBazFields,
            body: {
              blocks: [
                { type: RichTextBlockType.entity, data: { id: bar1Id } },
                { type: RichTextBlockType.entity, data: null },
                {
                  type: RichTextBlockType.valueItem,
                  data: {
                    type: 'EntityAdminStringReference',
                    string: 'Hello bar 2',
                    reference: { id: bar2Id },
                  },
                },
                { type: RichTextBlockType.valueItem, data: null },
              ],
            },
          },
        };

        expectResultValue(createBazResult, { effect: 'created', entity: expectedBazEntity });

        const getResult = await client.getEntity({ id: bazId });
        expectResultValue(getResult, expectedBazEntity);

        const referencingBar1Result = await client.searchEntities({
          referencing: bar1Id,
        });
        expectSearchResultEntities(referencingBar1Result, [baz]);

        const referencingBar2Result = await client.searchEntities({
          referencing: bar2Id,
        });
        expectSearchResultEntities(referencingBar2Result, [baz]);
      }
    }
  });

  test('Create EntityAdminBaz with location and location list', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        location: { lat: 55.60498, lng: 13.003822 },
        locations: [
          { lat: 55.60498, lng: 13.003822 },
          { lat: 56.381561, lng: 13.99286 },
        ],
      },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
          createdAt,
          updatedAt,
        },
        fields: {
          ...emptyBazFields,
          location: { lat: 55.60498, lng: 13.003822 },
          locations: [
            { lat: 55.60498, lng: 13.003822 },
            { lat: 56.381561, lng: 13.99286 },
          ],
        },
      };

      expectResultValue(createResult, { effect: 'created', entity: expectedEntity });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  });

  test('Create EntityAdminBaz with reference list', async () => {
    const createBar1Result = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar1' },
      fields: {},
    });
    const createBar2Result = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar2' },
      fields: {},
    });

    if (expectOkResult(createBar1Result) && expectOkResult(createBar2Result)) {
      const {
        entity: { id: bar1Id },
      } = createBar1Result.value;
      const {
        entity: { id: bar2Id },
      } = createBar2Result.value;

      const createBazResult = await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'Baz' },
        fields: { bars: [{ id: bar1Id }, { id: bar2Id }] },
      });
      if (expectOkResult(createBazResult)) {
        const { entity: baz } = createBazResult.value;
        const {
          entity: {
            id,
            info: { name, createdAt, updatedAt },
          },
        } = createBazResult.value;

        const expectedEntity: AdminEntity = {
          id,
          info: {
            type: 'EntityAdminBaz',
            name: name,
            version: 0,
            publishingState: EntityPublishState.Draft,
            createdAt,
            updatedAt,
          },
          fields: { ...emptyBazFields, bars: [{ id: bar1Id }, { id: bar2Id }] },
        };

        expectResultValue(createBazResult, { effect: 'created', entity: expectedEntity });

        const getResult = await client.getEntity({ id });
        expectResultValue(getResult, expectedEntity);

        const referencesTo1 = await client.searchEntities({ referencing: bar1Id });
        expectSearchResultEntities(referencesTo1, [baz]);

        const referencesTo2 = await client.searchEntities({ referencing: bar2Id });
        expectSearchResultEntities(referencesTo2, [baz]);
      }
    }
  });

  test('Create EntityAdminBaz with EntityAdminTwoStrings value type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: { twoStrings: { type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' } },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
          createdAt,
          updatedAt,
        },
        fields: {
          ...emptyBazFields,
          twoStrings: { type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' },
        },
      };

      expectResultValue(createResult, { effect: 'created', entity: expectedEntity });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  });

  test('Create EntityAdminBaz with list of EntityAdminTwoStrings value type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        twoStringsList: [
          { type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' },
          { type: 'EntityAdminTwoStrings', one: 'Three', two: 'Four' },
        ],
      },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
          createdAt,
          updatedAt,
        },
        fields: {
          ...emptyBazFields,
          twoStringsList: [
            { type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' },
            { type: 'EntityAdminTwoStrings', one: 'Three', two: 'Four' },
          ],
        },
      };

      expectResultValue(createResult, { effect: 'created', entity: expectedEntity });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  });

  test('Create EntityAdminBaz with EntityAdminBooleanString value type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        booleanString: { type: 'EntityAdminBooleanString', boolean: true, string: 'String' },
      },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
          createdAt,
          updatedAt,
        },
        fields: {
          ...emptyBazFields,
          booleanString: { type: 'EntityAdminBooleanString', boolean: true, string: 'String' },
        },
      };

      expectResultValue(createResult, { effect: 'created', entity: expectedEntity });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  });

  test('Create EntityAdminBaz with EntityAdminStringReference value type', async () => {
    const createBarResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar' },
      fields: {},
    });
    if (expectOkResult(createBarResult)) {
      const {
        entity: { id: barId },
      } = createBarResult.value;

      const createBazResult = await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'Baz' },
        fields: {
          stringReference: {
            type: 'EntityAdminStringReference',
            string: 'Hello string',
            reference: { id: barId },
          },
        },
      });
      if (expectOkResult(createBazResult)) {
        const { entity: baz } = createBazResult.value;
        const {
          entity: {
            id: bazId,
            info: { name: bazName, createdAt, updatedAt },
          },
        } = createBazResult.value;

        const expectedEntity: AdminEntity = {
          id: bazId,
          info: {
            type: 'EntityAdminBaz',
            name: bazName,
            version: 0,
            publishingState: EntityPublishState.Draft,
            createdAt,
            updatedAt,
          },
          fields: {
            ...emptyBazFields,
            stringReference: {
              type: 'EntityAdminStringReference',
              string: 'Hello string',
              reference: { id: barId },
            },
          },
        };

        expectResultValue(createBazResult, { effect: 'created', entity: expectedEntity });

        const getResult = await client.getEntity({ id: bazId });
        expectResultValue(getResult, expectedEntity);

        const barReferences = await client.searchEntities({ referencing: barId });
        expectSearchResultEntities(barReferences, [baz]);
      }
    }
  });

  test('Create EntityAdminBaz with EntityAdminListFields value type', async () => {
    const createBar1Result = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar 1' },
      fields: {},
    });
    const createBar2Result = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar 2' },
      fields: {},
    });
    if (expectOkResult(createBar1Result) && expectOkResult(createBar2Result)) {
      const {
        entity: { id: bar1Id },
      } = createBar1Result.value;
      const {
        entity: { id: bar2Id },
      } = createBar2Result.value;

      const createBazResult = await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'Baz' },
        fields: {
          listFields: {
            type: 'EntityAdminListFields',
            stringList: ['one', 'two', 'three'],
            referenceList: [{ id: bar1Id }, { id: bar2Id }],
          },
          listFieldsList: [
            {
              type: 'EntityAdminListFields',
              stringList: ['three', 'two', 'one'],
              referenceList: [{ id: bar2Id }, { id: bar1Id }],
            },
            {
              type: 'EntityAdminListFields',
              stringList: ['one', 'two', 'three'],
              referenceList: [{ id: bar1Id }, { id: bar2Id }],
            },
          ],
        },
      });
      if (expectOkResult(createBazResult)) {
        const {
          entity: {
            id: bazId,
            info: { name: bazName, createdAt, updatedAt },
          },
        } = createBazResult.value;

        const expectedEntity: AdminEntity = {
          id: bazId,
          info: {
            type: 'EntityAdminBaz',
            name: bazName,
            version: 0,
            publishingState: EntityPublishState.Draft,
            createdAt,
            updatedAt,
          },
          fields: {
            ...emptyBazFields,
            listFields: {
              type: 'EntityAdminListFields',
              stringList: ['one', 'two', 'three'],
              referenceList: [{ id: bar1Id }, { id: bar2Id }],
            },
            listFieldsList: [
              {
                type: 'EntityAdminListFields',
                stringList: ['three', 'two', 'one'],
                referenceList: [{ id: bar2Id }, { id: bar1Id }],
              },
              {
                type: 'EntityAdminListFields',
                stringList: ['one', 'two', 'three'],
                referenceList: [{ id: bar1Id }, { id: bar2Id }],
              },
            ],
          },
        };

        expectResultValue(createBazResult, { effect: 'created', entity: expectedEntity });

        const getResult = await client.getEntity({ id: bazId });
        expectResultValue(getResult, expectedEntity);

        const bar1References = await client.searchEntities({ referencing: bar1Id });

        expect(
          bar1References.isOk() &&
            bar1References.value?.edges.map((x) => (x.node.isOk() ? x.node.value.id : null))
        ).toEqual([bazId]);

        const bar2References = await client.searchEntities({ referencing: bar2Id });

        expect(
          bar2References.isOk() &&
            bar2References.value?.edges.map((x) => (x.node.isOk() ? x.node.value.id : null))
        ).toEqual([bazId]);
      }
    }
  });

  test('Create EntityAdminBaz with EntityAdminNested value type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        nested: {
          type: 'EntityAdminNested',
          title: 'Nested 0',
          child: {
            type: 'EntityAdminNested',
            title: 'Nested 0.a',
            child: {
              type: 'EntityAdminNested',
              title: 'Nested 0.a.I',
            },
          },
        },
      },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id: bazId,
          info: { name: bazName, createdAt, updatedAt },
        },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id: bazId,
        info: {
          type: 'EntityAdminBaz',
          name: bazName,
          version: 0,
          publishingState: EntityPublishState.Draft,
          createdAt,
          updatedAt,
        },
        fields: {
          ...emptyBazFields,
          nested: {
            type: 'EntityAdminNested',
            title: 'Nested 0',
            child: {
              type: 'EntityAdminNested',
              title: 'Nested 0.a',
              child: {
                type: 'EntityAdminNested',
                title: 'Nested 0.a.I',
                child: null,
              },
            },
          },
        },
      };

      expectResultValue(createResult, {
        effect: 'created',
        entity: expectedEntity,
      });

      const getResult = await client.getEntity({ id: bazId });
      expectResultValue(getResult, expectedEntity);
    }
  });

  test('Error: Create with invalid type', async () => {
    const result = await client.createEntity({
      info: { type: 'Invalid', name: 'name' },
      fields: { foo: 'title' },
    });

    expectErrorResult(result, ErrorType.BadRequest, 'Entity type Invalid doesn’t exist');
  });

  test('Error: Create without type', async () => {
    const result = await client.createEntity({
      info: { type: '', name: 'Foo' },
      fields: { foo: 'title' },
    });

    expectErrorResult(result, ErrorType.BadRequest, 'Missing entity.info.type');
  });

  test('Error: Create with already existing', async () => {
    const firstCreateResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo' },
      fields: { title: 'First' },
    });

    if (expectOkResult(firstCreateResult)) {
      const {
        entity: { id },
      } = firstCreateResult.value;

      const secondCreateResult = await client.createEntity({
        id,
        info: { type: 'EntityAdminBar', name: 'Bar' },
        fields: { title: 'Second' },
      });

      expectErrorResult(
        secondCreateResult,
        ErrorType.Conflict,
        `Entity with id (${id}) already exist`
      );
    }
  });

  test('Error: Create without name', async () => {
    const result = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: '' },
      fields: { title: 'title' },
    });

    expectErrorResult(result, ErrorType.BadRequest, 'Missing entity.info.name');
  });

  test('Error: Create with invalid version', async () => {
    const result = await client.createEntity({
      info: {
        type: 'EntityAdminFoo',
        name: 'Foo',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        version: 1 as any,
      },
      fields: {},
    });

    expectErrorResult(result, ErrorType.BadRequest, 'Unsupported version for create: 1');
  });

  test('Error: Create with invalid field', async () => {
    const result = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo' },
      fields: { invalid: 'hello' },
    });

    expectErrorResult(result, ErrorType.BadRequest, 'Unsupported field names: invalid');
  });

  test('Error: Create EntityAdminFoo with reference to missing entity', async () => {
    const result = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo name' },
      fields: { title: 'Foo title', bar: { id: 'fcc46a9e-2097-4bd6-bb08-56d5f59db26b' } },
    });
    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'entity.fields.bar: referenced entity (fcc46a9e-2097-4bd6-bb08-56d5f59db26b) doesn’t exist'
    );
  });

  test('Error: Create EntityAdminFoo with reference to wrong entity type', async () => {
    const referenceId = entitiesOfTypeAdminOnlyEditBefore[0].id;
    const result = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo name' },
      fields: {
        title: 'Foo title',
        bar: { id: referenceId },
      },
    });
    expectErrorResult(
      result,
      ErrorType.BadRequest,
      `entity.fields.bar: referenced entity (${referenceId}) has an invalid type AdminOnlyEditBefore`
    );
  });

  test('Error: Set string when expecting list of string', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        tags: 'invalid',
      },
    });
    expectErrorResult(createResult, ErrorType.BadRequest, 'entity.fields.tags: expected list');
  });

  test('Error: Set list of string when expecting string', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        title: ['invalid', 'foo'],
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.title: expected string, got list'
    );
  });

  test('Error: Set reference when expecting list of references', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        bars: { id: 'fcc46a9e-2097-4bd6-bb08-56d5f59db26b' },
      },
    });
    expectErrorResult(createResult, ErrorType.BadRequest, 'entity.fields.bars: expected list');
  });

  test('Error: Set list of references when expecting reference', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        bar: [
          { id: 'fcc46a9e-2097-4bd6-bb08-56d5f59db26b' },
          { id: 'fcc46a9e-2097-4bd6-bb08-56d5f59db26b' },
        ],
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.bar: expected reference, got list'
    );
  });

  test('Error: value type missing type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        twoStrings: { one: 'One', two: 'Two' },
      },
    });
    expectErrorResult(createResult, ErrorType.BadRequest, 'entity.fields.twoStrings: missing type');
  });

  test('Error: value type with invalid type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        twoStrings: { type: 'Invalid' },
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.twoStrings: value type Invalid doesn’t exist'
    );
  });

  test('Error: value type with wrong type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        oneString: { type: 'EntityAdminTwoStrings', one: 'One', two: 'Two' },
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.oneString: value of type EntityAdminTwoStrings is not allowed'
    );
  });

  test('Error: value type with invalid field', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        oneString: { type: 'EntityAdminOneString', one: 'One', invalid: 'value' },
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.oneString: Unsupported field names: invalid'
    );
  });

  test('Error: rich text single, where list is expected', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        bodyList: { blocks: [] },
      },
    });
    expectErrorResult(createResult, ErrorType.BadRequest, 'entity.fields.bodyList: expected list');
  });

  test('Error: rich text list, where single is expected', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        body: [{ blocks: [] }],
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.body: expected single value, got list'
    );
  });

  test('Error: rich text, forgotten blocks', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        body: [{ type: RichTextBlockType.paragraph, data: { text: '' } }],
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.body: expected single value, got list'
    );
  });

  test('Error: rich text with string', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        body: 'Hello',
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.body: expected object, got string'
    );
  });

  test('Error: rich text without blocks', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        body: {},
      },
    });
    expectErrorResult(createResult, ErrorType.BadRequest, 'entity.fields.body: missing blocks');
  });

  test('Error: rich text, blocks as string', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        body: { blocks: 'Hello' },
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.body.blocks: expected array, got string'
    );
  });

  test('Error: rich text with version and time', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        body: { blocks: [], version: '123', time: 123123 },
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.body: unexpected keys version, time'
    );
  });

  test('Error: rich text with invalid block type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        bodyOnlyParagraph: { blocks: [{ type: RichTextBlockType.entity, data: null }] },
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.bodyOnlyParagraph[0]: rich text block of type entity is not allowed'
    );
  });

  test('Error: rich text with block with invalid keys', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        body: {
          blocks: [
            { type: RichTextBlockType.entity, data: null, invalid: true, unexpected: false },
          ],
        },
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.body[0]: unexpected keys invalid, unexpected'
    );
  });

  test('Error: single location when list expected', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        locations: { lat: 55.60498, lng: 13.003822 },
      },
    });
    expectErrorResult(createResult, ErrorType.BadRequest, 'entity.fields.locations: expected list');
  });

  test('Error: location list when single item expected', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        location: [{ lat: 55.60498, lng: 13.003822 }],
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.location: expected location, got list'
    );
  });

  test('Error: location with empty object', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        location: {},
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.location: expected {lat: number, lng: number}, got [object Object]'
    );
  });

  test('Error: single value type when list expected', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        twoStringsList: { type: 'EntityAdminTwoStrings', one: 'One', two: 'Two' },
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.twoStringsList: expected list'
    );
  });

  test('Error: list of value type when single item expected', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        twoStrings: [
          { type: 'EntityAdminTwoStrings', one: 'One', two: 'Two' },
          { type: 'EntityAdminTwoStrings', one: 'One', two: 'Two' },
        ],
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.fields.twoStrings: expected single value, got list'
    );
  });
});

function expectConnectionToMatchSlice(
  connection: Connection<Edge<AdminEntity, ErrorType>> | null,
  sliceStart: number,
  sliceEnd: number | undefined,
  compareFn?: (a: AdminEntity, b: AdminEntity) => number
) {
  const actualIds = connection?.edges.map((edge) => ({
    id: edge.node.isOk() ? edge.node.value.id : edge.node,
  }));

  let expectedEntities = entitiesOfTypeAdminOnlyEditBefore;
  if (compareFn) {
    expectedEntities = [...entitiesOfTypeAdminOnlyEditBefore].sort(compareFn);
  }

  const expectedIds = expectedEntities.slice(sliceStart, sliceEnd).map((x) => ({ id: x.id }));

  expect(actualIds).toEqual(expectedIds);
}

describe('searchEntities()', () => {
  test('Default => first 25', async () => {
    const result = await client.searchEntities({
      entityTypes: ['AdminOnlyEditBefore'],
    });
    if (expectOkResult(result)) {
      expectConnectionToMatchSlice(result.value, 0, 25);
    }
  });

  test('First', async () => {
    const result = await client.searchEntities(
      {
        entityTypes: ['AdminOnlyEditBefore'],
      },
      { first: 10 }
    );
    if (expectOkResult(result)) {
      expectConnectionToMatchSlice(result.value, 0, 10);
    }
  });

  test('First 0', async () => {
    const result = await client.searchEntities(
      {
        entityTypes: ['AdminOnlyEditBefore'],
      },
      { first: 0 }
    );
    if (expectOkResult(result)) {
      expect(result.value).toBeNull();
    }
  });

  test('Last 0', async () => {
    const result = await client.searchEntities(
      {
        entityTypes: ['AdminOnlyEditBefore'],
      },
      { last: 0 }
    );
    if (expectOkResult(result)) {
      expect(result.value).toBeNull();
    }
  });

  test('Last', async () => {
    const result = await client.searchEntities(
      {
        entityTypes: ['AdminOnlyEditBefore'],
      },
      { last: 10 }
    );
    if (expectOkResult(result)) {
      expectConnectionToMatchSlice(result.value, -10, undefined);
    }
  });

  test('First after', async () => {
    const firstResult = await client.searchEntities(
      {
        entityTypes: ['AdminOnlyEditBefore'],
      },
      { first: 10 }
    );
    if (expectOkResult(firstResult)) {
      const secondResult = await client.searchEntities(
        {
          entityTypes: ['AdminOnlyEditBefore'],
        },
        { first: 20, after: firstResult.value?.pageInfo.endCursor }
      );
      if (expectOkResult(secondResult)) {
        expectConnectionToMatchSlice(secondResult.value, 10, 10 + 20);
      }
    }
  });

  test('Last before', async () => {
    const firstResult = await client.searchEntities(
      {
        entityTypes: ['AdminOnlyEditBefore'],
      },
      { last: 10 }
    );
    if (expectOkResult(firstResult)) {
      const secondResult = await client.searchEntities(
        {
          entityTypes: ['AdminOnlyEditBefore'],
        },
        { last: 20, before: firstResult.value?.pageInfo.startCursor }
      );
      if (expectOkResult(secondResult)) {
        expectConnectionToMatchSlice(secondResult.value, -10 - 20, -10);
      }
    }
  });

  test('First between', async () => {
    const firstResult = await client.searchEntities(
      {
        entityTypes: ['AdminOnlyEditBefore'],
      },
      { first: 20 }
    );
    if (expectOkResult(firstResult)) {
      const secondResult = await client.searchEntities(
        {
          entityTypes: ['AdminOnlyEditBefore'],
        },
        {
          first: 20,
          after: firstResult.value?.edges[2].cursor,
          before: firstResult.value?.edges[8].cursor,
        }
      );
      if (expectOkResult(secondResult)) {
        expectConnectionToMatchSlice(secondResult.value, 3 /*inclusive*/, 8 /*exclusive*/);
      }
    }
  });

  test('Last between', async () => {
    const firstResult = await client.searchEntities(
      {
        entityTypes: ['AdminOnlyEditBefore'],
      },
      { first: 20 }
    );
    if (expectOkResult(firstResult)) {
      const secondResult = await client.searchEntities(
        {
          entityTypes: ['AdminOnlyEditBefore'],
        },
        {
          last: 20,
          after: firstResult.value?.edges[2].cursor,
          before: firstResult.value?.edges[8].cursor,
        }
      );
      if (expectOkResult(secondResult)) {
        expectConnectionToMatchSlice(secondResult.value, 3 /*inclusive*/, 8 /*exclusive*/);
      }
    }
  });

  test('First default, ordered by createdAt', async () => {
    const result = await client.searchEntities(
      {
        entityTypes: ['AdminOnlyEditBefore'],
        order: QueryOrder.createdAt,
      },
      { first: 20 }
    );
    if (expectOkResult(result)) {
      expectConnectionToMatchSlice(result.value, 0, 20);
    }
  });

  test('First default, ordered by name', async () => {
    const result = await client.searchEntities(
      {
        entityTypes: ['AdminOnlyEditBefore'],
        order: QueryOrder.name,
      },
      { first: 20 }
    );
    if (expectOkResult(result)) {
      expectConnectionToMatchSlice(result.value, 0, 20, (a, b) => {
        return a.info.name < b.info.name ? -1 : 1;
      });
    }
  });

  test('First default, ordered by updatedAt', async () => {
    const result = await client.searchEntities(
      {
        entityTypes: ['AdminOnlyEditBefore'],
        order: QueryOrder.updatedAt,
      },
      { first: 20 }
    );
    expectOkResult(result);
    //TODO expose updatedAt
    // if (expectOkResult(result)) {
    //   expectConnectionToMatchSlice(result.value, 0, 20, (a, b) => {
    //     return a.info.name < b.info.name ? -1 : 1;
    //   });
    // }
  });

  test('Query based on referencing, one reference', async () => {
    const { barId, fooEntities } = await createBarWithFooBazReferences(1, 0);
    const [fooEntity] = fooEntities;

    const searchResult = await client.searchEntities({ referencing: barId });
    expectSearchResultEntities(searchResult, [fooEntity]);
  });

  test('Query based on referencing, no references', async () => {
    const { barId } = await createBarWithFooBazReferences(0, 0);

    const searchResult = await client.searchEntities({ referencing: barId });
    expectResultValue(searchResult, null);
  });

  test('Query based on referencing, two references from one entity', async () => {
    const { barId, bazEntities } = await createBarWithFooBazReferences(0, 1, 2);

    const searchResult = await client.searchEntities({ referencing: barId });
    expectSearchResultEntities(searchResult, bazEntities);
  });

  test('Query based on referencing and entityTypes, one reference', async () => {
    const { barId, bazEntities } = await createBarWithFooBazReferences(1, 1);
    const [bazEntity] = bazEntities;

    const searchResult = await client.searchEntities({
      entityTypes: ['EntityAdminBaz'],
      referencing: barId,
    });
    expectSearchResultEntities(searchResult, [bazEntity]);
  });

  test('Query based on bounding box', async () => {
    const boundingBox = randomBoundingBox();
    const center = {
      lat: (boundingBox.minLat + boundingBox.maxLat) / 2,
      lng: (boundingBox.minLng + boundingBox.maxLng) / 2,
    };
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: { location: center },
    });

    if (expectOkResult(createResult)) {
      const {
        entity: { id: fooId },
      } = createResult.value;
      const searchResult = await client.searchEntities({ boundingBox });
      if (expectOkResult(searchResult)) {
        let fooIdCount = 0;
        for (const edge of searchResult.value?.edges ?? []) {
          if (expectOkResult(edge.node)) {
            if (edge.node.value.id === fooId) {
              fooIdCount += 1;
            }
          }
        }
        expect(fooIdCount).toBe(1);
      }
    }
  });

  test('Query based on bounding box (outside)', async () => {
    const boundingBox = randomBoundingBox();
    const outside = {
      lat: (boundingBox.minLat + boundingBox.maxLat) / 2,
      lng: boundingBox.minLng > 0 ? boundingBox.minLng - 1 : boundingBox.maxLng + 1,
    };
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: { location: outside },
    });

    if (expectOkResult(createResult)) {
      const {
        entity: { id: fooId },
      } = createResult.value;
      const searchResult = await client.searchEntities({ boundingBox });
      if (expectOkResult(searchResult)) {
        let fooIdCount = 0;
        for (const edge of searchResult.value?.edges ?? []) {
          if (expectOkResult(edge.node)) {
            if (edge.node.value.id === fooId) {
              fooIdCount += 1;
            }
          }
        }
        expect(fooIdCount).toBe(0);
      }
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

    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: { locations: [center, inside] },
    });

    if (expectOkResult(createResult)) {
      const {
        entity: { id: fooId },
      } = createResult.value;
      const searchResult = await client.searchEntities({ boundingBox });
      if (expectOkResult(searchResult)) {
        let fooIdCount = 0;
        for (const edge of searchResult.value?.edges ?? []) {
          if (expectOkResult(edge.node)) {
            if (edge.node.value.id === fooId) {
              fooIdCount += 1;
            }
          }
        }
        expect(fooIdCount).toBe(1);
      }
    }
  });

  test('Query based on bounding box for rich text', async () => {
    const boundingBox = randomBoundingBox();
    const center = {
      lat: (boundingBox.minLat + boundingBox.maxLat) / 2,
      lng: (boundingBox.minLng + boundingBox.maxLng) / 2,
    };

    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {
        body: {
          blocks: [
            {
              type: RichTextBlockType.valueItem,
              data: {
                type: 'EntityAdminStringedLocation',
                string: 'Hello location',
                location: center,
              },
            },
          ],
        },
      },
    });

    if (expectOkResult(createResult)) {
      const {
        entity: {
          id: bazId,
          info: { name: bazName, createdAt, updatedAt },
        },
      } = createResult.value;
      const searchResult = await client.searchEntities({ boundingBox });
      if (expectOkResult(searchResult)) {
        let bazIdCount = 0;
        for (const edge of searchResult.value?.edges ?? []) {
          if (expectOkResult(edge.node)) {
            if (edge.node.value.id === bazId) {
              bazIdCount += 1;

              expectResultValue(edge.node, {
                id: bazId,
                info: {
                  type: 'EntityAdminBaz',
                  name: bazName,
                  version: 0,
                  publishingState: EntityPublishState.Draft,
                  createdAt,
                  updatedAt,
                },
                fields: {
                  ...emptyBazFields,
                  body: {
                    blocks: [
                      {
                        type: RichTextBlockType.valueItem,
                        data: {
                          type: 'EntityAdminStringedLocation',
                          string: 'Hello location',
                          location: center,
                        },
                      },
                    ],
                  },
                },
              });
            }
          }
        }
        expect(bazIdCount).toBe(1);
      }
    }
  });

  test('Query based on text (after creation and updating)', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo' },
      fields: { summary: 'this is some serious summary with the best conclusion' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id: fooId },
      } = createResult.value;

      const matchesInitial = await countSearchResultWithEntity(
        {
          entityTypes: ['EntityAdminFoo'],
          text: 'serious conclusion',
        },
        fooId
      );
      expect(matchesInitial).toBe(1);

      const matchesBeforeUpdate = await countSearchResultWithEntity(
        {
          entityTypes: ['EntityAdminFoo'],
          text: 'fox jumping',
        },
        fooId
      );
      expect(matchesBeforeUpdate).toBe(0);

      expectOkResult(
        await client.updateEntity({
          id: fooId,
          fields: { summary: "who's jumping? It it the fox" },
        })
      );

      const matchesAfterUpdate = await countSearchResultWithEntity(
        {
          entityTypes: ['EntityAdminFoo'],
          text: 'fox jumping',
        },
        fooId
      );
      expect(matchesAfterUpdate).toBe(1);
    }
  });
});

describe('getTotalCount', () => {
  test('Check that we get the correct count', async () => {
    const result = await client.getTotalCount({
      entityTypes: ['AdminOnlyEditBefore'],
    });
    if (expectOkResult(result)) {
      expect(result.value).toBe(entitiesOfTypeAdminOnlyEditBefore.length);
    }
  });

  test('Query based on referencing, one reference', async () => {
    const { barId } = await createBarWithFooBazReferences(1, 0);

    const result = await client.getTotalCount({ referencing: barId });
    if (expectOkResult(result)) {
      expect(result.value).toBe(1);
    }
  });

  test('Query based on referencing, no references', async () => {
    const { barId } = await createBarWithFooBazReferences(0, 0);

    const result = await client.getTotalCount({ referencing: barId });
    if (expectOkResult(result)) {
      expect(result.value).toBe(0);
    }
  });

  test('Query based on referencing and entityTypes, one reference', async () => {
    const { barId } = await createBarWithFooBazReferences(1, 1);

    const result = await client.getTotalCount({
      entityTypes: ['EntityAdminBaz'],
      referencing: barId,
    });
    if (expectOkResult(result)) {
      expect(result.value).toBe(1);
    }
  });

  test('Query based on referencing, two references from one entity', async () => {
    const { barId } = await createBarWithFooBazReferences(0, 1, 2);

    const result = await client.getTotalCount({ referencing: barId });
    if (expectOkResult(result)) {
      expect(result.value).toBe(1);
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

    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: { locations: [center, inside] },
    });

    if (expectOkResult(createResult)) {
      const searchResult = await client.searchEntities({ boundingBox });

      const totalResult = await client.getTotalCount({ boundingBox });
      if (expectOkResult(searchResult) && expectOkResult(totalResult)) {
        // Hopefully there aren't too many entities in the bounding box
        expect(searchResult.value?.pageInfo.hasNextPage).toBeFalsy();

        expect(totalResult.value).toBe(searchResult.value?.edges.length);
      }
    }
  });

  test('Query based on text', async () => {
    const resultBefore = await client.getTotalCount({ text: 'sensational clown' });
    if (expectOkResult(resultBefore)) {
      expectOkResult(
        await client.createEntity({
          info: { type: 'EntityAdminFoo', name: 'foo' },
          fields: { summary: 'That was indeed a sensational clown' },
        })
      );

      const resultAfter = await client.getTotalCount({ text: 'sensational clown' });
      if (expectOkResult(resultAfter)) {
        expect(resultAfter.value).toBe(resultBefore.value + 1);
      }
    }
  });
});

describe('updateEntity()', () => {
  test('Update EntityAdminFoo and publish', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Original' },
      fields: { title: 'Original' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminFoo',
          name: createResult.value.entity.info.name,
          version: 0,
          publishingState: EntityPublishState.Draft,
          createdAt: createResult.value.entity.info.createdAt,
          updatedAt: createResult.value.entity.info.updatedAt,
        },
        fields: {
          ...emptyFooFields,
          title: 'Original',
        },
      };

      expectResultValue(createResult, { effect: 'created', entity: expectedEntity });

      const updateResult = await client.updateEntity({
        id,
        info: { type: 'EntityAdminFoo', name: 'Updated name' },
        fields: { title: 'Updated title' },
      });
      if (expectOkResult(updateResult)) {
        const {
          entity: {
            info: { name },
          },
        } = updateResult.value;
        expect(name).toMatch(/^Updated name(#[0-9]+)?$/);

        expectedEntity.info.name = name;
        expectedEntity.info.version = 1;
        expectedEntity.info.updatedAt = updateResult.value.entity.info.updatedAt;
        expectedEntity.fields.title = 'Updated title';

        expectResultValue(updateResult, { effect: 'updated', entity: expectedEntity });

        const publishResult = await client.publishEntities([{ id, version: 1 }]);
        if (expectOkResult(publishResult)) {
          const [{ updatedAt }] = publishResult.value;
          expectResultValue(publishResult, [
            { id, publishState: EntityPublishState.Published, updatedAt },
          ]);

          expectedEntity.info.publishingState = EntityPublishState.Published;
          expectedEntity.info.updatedAt = updatedAt;
        }

        const historyResult = await client.getEntityHistory({ id });
        if (expectOkResult(historyResult)) {
          expectEntityHistoryVersions(historyResult.value, [
            {
              version: 0,
              published: false,
              createdBy: context.session.subjectId,
            },
            {
              version: 1,
              published: true,
              createdBy: context.session.subjectId,
            },
          ]);
        }

        const version0Result = await client.getEntity({ id, version: 0 });
        expectResultValue(
          version0Result,
          copyEntity(expectedEntity, { info: { version: 0 }, fields: { title: 'Original' } })
        );

        const version1Result = await client.getEntity({ id, version: 1 });
        expectResultValue(version1Result, expectedEntity);

        const publishedResult = await publishedClient.getEntity({ id });
        expectResultValue(publishedResult, {
          id,
          info: { type: 'EntityAdminFoo', name: expectedEntity.info.name },
          fields: { ...emptyFooFields, title: 'Updated title' },
        });
      }
    }
  });

  test('Update EntityAdminFoo w/o publish', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'First' },
      fields: { title: 'First' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminFoo',
          name: createResult.value.entity.info.name,
          version: 0,
          publishingState: EntityPublishState.Draft,
          createdAt: createResult.value.entity.info.createdAt,
          updatedAt: createResult.value.entity.info.updatedAt,
        },
        fields: {
          ...emptyFooFields,
          title: 'First',
        },
      };

      expectResultValue(createResult, { effect: 'created', entity: expectedEntity });

      const publishResult = await client.publishEntities([{ id, version: 0 }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          { id, publishState: EntityPublishState.Published, updatedAt },
        ]);

        expectedEntity.info.publishingState = EntityPublishState.Published;
      }

      const updateResult = await client.updateEntity({
        id,
        info: { type: 'EntityAdminFoo', name: 'Updated name' },
        fields: { title: 'Updated title' },
      });
      if (expectOkResult(updateResult)) {
        const {
          entity: {
            info: { name },
          },
        } = updateResult.value;
        expect(name).toMatch(/^Updated name(#[0-9]+)?$/);

        expectedEntity.info.name = name;
        expectedEntity.info.updatedAt = updateResult.value.entity.info.updatedAt;
        expectedEntity.info.publishingState = EntityPublishState.Modified;
        expectedEntity.info.version = 1;
        expectedEntity.fields.title = 'Updated title';

        expectResultValue(updateResult, { effect: 'updated', entity: expectedEntity });

        const historyResult = await client.getEntityHistory({ id });
        if (expectOkResult(historyResult)) {
          expectEntityHistoryVersions(historyResult.value, [
            {
              version: 0,
              published: true,
              createdBy: context.session.subjectId,
            },
            {
              version: 1,
              published: false,
              createdBy: context.session.subjectId,
            },
          ]);
        }

        const version0Result = await client.getEntity({ id, version: 0 });
        expectResultValue(
          version0Result,
          copyEntity(expectedEntity, { info: { version: 0 }, fields: { title: 'First' } })
        );

        const version1Result = await client.getEntity({ id, version: 1 });
        expectResultValue(version1Result, expectedEntity);

        const publishedResult = await publishedClient.getEntity({ id });
        expectResultValue(publishedResult, {
          id,
          info: { type: 'EntityAdminFoo', name },
          fields: {
            ...emptyFooFields,
            title: 'First',
          },
        });
      }
    }
  });

  test('Update EntityAdminFoo w/o type and name', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Original' },
      fields: { title: 'Original' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminFoo',
          name: createResult.value.entity.info.name,
          version: 1,
          publishingState: EntityPublishState.Draft,
          createdAt: createResult.value.entity.info.createdAt,
          updatedAt: createResult.value.entity.info.updatedAt,
        },
        fields: {
          ...emptyFooFields,
          title: 'Updated title',
        },
      };

      const updateResult = await client.updateEntity({ id, fields: { title: 'Updated title' } });
      if (expectOkResult(updateResult)) {
        expectedEntity.info.updatedAt = updateResult.value.entity.info.updatedAt;

        expectResultValue(updateResult, { effect: 'updated', entity: expectedEntity });
      }

      const publishResult = await client.publishEntities([{ id, version: 1 }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          { id, publishState: EntityPublishState.Published, updatedAt },
        ]);

        expectedEntity.info.publishingState = EntityPublishState.Published;
        expectedEntity.info.updatedAt = updatedAt;
      }

      const historyResult = await client.getEntityHistory({ id });
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            published: false,
            createdBy: context.session.subjectId,
          },
          {
            version: 1,
            published: true,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await client.getEntity({ id, version: 0 });
      expectResultValue(
        version0Result,
        copyEntity(expectedEntity, { info: { version: 0 }, fields: { title: 'Original' } })
      );

      const version1Result = await client.getEntity({ id, version: 1 });
      expectResultValue(version1Result, expectedEntity);

      const publishedResult = await publishedClient.getEntity({ id });
      expectResultValue(publishedResult, {
        id,
        info: { type: 'EntityAdminFoo', name: expectedEntity.info.name },
        fields: { ...emptyFooFields, title: 'Updated title' },
      });
    }
  });

  test('Update EntityAdminFoo w/o providing all fields', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'First name' },
      fields: { title: 'First title', summary: 'First summary' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminFoo',
          name: createResult.value.entity.info.name,
          version: 0,
          publishingState: EntityPublishState.Draft,
          createdAt: createResult.value.entity.info.createdAt,
          updatedAt: createResult.value.entity.info.updatedAt,
        },
        fields: {
          ...emptyFooFields,
          title: 'First title',
          summary: 'First summary',
        },
      };

      expectResultValue(createResult, { effect: 'created', entity: expectedEntity });

      const updateResult = await client.updateEntity({
        id,
        fields: { summary: 'Updated summary' },
      });
      if (expectOkResult(updateResult)) {
        expectedEntity.info.version = 1;
        expectedEntity.info.updatedAt = updateResult.value.entity.info.updatedAt;
        expectedEntity.fields.summary = 'Updated summary';
        expectResultValue(updateResult, { effect: 'updated', entity: expectedEntity });
      }

      const publishResult = await client.publishEntities([{ id, version: 1 }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          { id, publishState: EntityPublishState.Published, updatedAt },
        ]);

        expectedEntity.info.publishingState = EntityPublishState.Published;
        expectedEntity.info.updatedAt = updatedAt;
      }

      const historyResult = await client.getEntityHistory({ id });
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            published: false,
            createdBy: context.session.subjectId,
          },
          {
            version: 1,
            published: true,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await client.getEntity({ id, version: 0 });
      expectResultValue(
        version0Result,
        copyEntity(expectedEntity, { info: { version: 0 }, fields: { summary: 'First summary' } })
      );

      const version1Result = await client.getEntity({ id, version: 1 });
      expectResultValue(version1Result, expectedEntity);

      const publishedResult = await publishedClient.getEntity({ id });
      expectResultValue(publishedResult, {
        id,
        info: { type: 'EntityAdminFoo', name: expectedEntity.info.name },
        fields: {
          ...emptyFooFields,
          title: 'First title',
          summary: 'Updated summary',
        },
      });
    }
  });

  test('Update EntityAdminFoo with the same name', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'First name' },
      fields: { title: 'First title', summary: 'First summary' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name },
        },
      } = createResult.value;

      const updateResult = await client.updateEntity({ id, info: { name }, fields: {} });
      expectResultValue(updateResult, { effect: 'none', entity: createResult.value.entity });

      const publishResult = await client.publishEntities([{ id, version: 0 }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          { id, publishState: EntityPublishState.Published, updatedAt },
        ]);
      }

      const publishedResult = await publishedClient.getEntity({ id });
      expectResultValue(publishedResult, {
        id,
        info: { type: 'EntityAdminFoo', name },
        fields: { ...emptyFooFields, title: 'First title', summary: 'First summary' },
      });
    }
  });

  test('Update EntityAdminFoo normalizes empty string', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Draft' },
      fields: { title: 'Hello' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const updateResult = await client.updateEntity({ id, fields: { title: '' } });
      if (expectOkResult(updateResult)) {
        const {
          entity: {
            fields: { title },
          },
        } = updateResult.value;

        expect(title).toBe(null);
      }
    }
  });

  test('Update EntityAdminFoo normalizes empty value item', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Draft' },
      fields: {},
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          type: 'EntityAdminBaz',
          version: 0,
          name: createResult.value.entity.info.name,
          publishingState: EntityPublishState.Draft,
          createdAt: createResult.value.entity.info.createdAt,
          updatedAt: createResult.value.entity.info.updatedAt,
        },
        fields: { ...emptyBazFields },
      };

      expectResultValue(createResult, { effect: 'created', entity: expectedEntity });

      const updateResult = await client.updateEntity({
        id,
        fields: { twoStrings: { type: 'EntityAdminTwoStrings' } },
      });
      if (expectOkResult(updateResult)) {
        expectedEntity.info.version = 1;
        expectedEntity.info.updatedAt = updateResult.value.entity.info.updatedAt;
        expectedEntity.fields.twoStrings = { type: 'EntityAdminTwoStrings', one: null, two: null };
      }
      expectResultValue(updateResult, { effect: 'updated', entity: expectedEntity });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  });

  test('Update EntityAdminFoo with reference', async () => {
    const createFooResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'First name' },
      fields: { title: 'First title', summary: 'First summary' },
    });
    if (expectOkResult(createFooResult)) {
      const {
        entity: { id: fooId },
      } = createFooResult.value;

      const expectedEntity: AdminEntity = {
        id: fooId,
        info: {
          type: 'EntityAdminFoo',
          name: createFooResult.value.entity.info.name,
          version: 0,
          publishingState: EntityPublishState.Draft,
          createdAt: createFooResult.value.entity.info.createdAt,
          updatedAt: createFooResult.value.entity.info.updatedAt,
        },
        fields: { ...emptyFooFields, title: 'First title', summary: 'First summary' },
      };

      expectResultValue(createFooResult, { effect: 'created', entity: expectedEntity });

      const createBarResult = await client.createEntity({
        info: { type: 'EntityAdminBar', name: 'Bar entity' },
        fields: { title: 'Bar entity' },
      });
      if (expectOkResult(createBarResult)) {
        const {
          entity: { id: barId },
        } = createBarResult.value;

        const updateResult = await client.updateEntity({
          id: fooId,
          fields: { bar: { id: barId } },
        });

        if (expectOkResult(updateResult)) {
          expectedEntity.info.version = 1;
          expectedEntity.info.updatedAt = updateResult.value.entity.info.updatedAt;
          expectedEntity.fields.bar = { id: barId };
        }

        expectResultValue(updateResult, { effect: 'updated', entity: expectedEntity });

        const publishResult = await client.publishEntities([
          { id: fooId, version: 1 },
          { id: barId, version: 0 },
        ]);
        if (expectOkResult(publishResult)) {
          const [{ updatedAt: fooUpdatedAt }, { updatedAt: barUpdatedAt }] = publishResult.value;
          expectResultValue(publishResult, [
            { id: fooId, publishState: EntityPublishState.Published, updatedAt: fooUpdatedAt },
            { id: barId, publishState: EntityPublishState.Published, updatedAt: barUpdatedAt },
          ]);
          expectedEntity.info.publishingState = EntityPublishState.Published;
          expectedEntity.info.updatedAt = fooUpdatedAt;
        }

        const version0Result = await client.getEntity({ id: fooId, version: 0 });
        expectResultValue(
          version0Result,
          copyEntity(expectedEntity, { info: { version: 0 }, fields: { bar: null } })
        );

        const version1Result = await client.getEntity({ id: fooId, version: 1 });
        expectResultValue(version1Result, expectedEntity);

        const publishedResult = await publishedClient.getEntity({ id: fooId });
        expectResultValue(publishedResult, {
          id: fooId,
          info: { type: 'EntityAdminFoo', name: expectedEntity.info.name },
          fields: { title: 'First title', summary: 'First summary', bar: { id: barId } },
        });
      }
    }
  });

  test('Update EntityAdminFoo without changing a reference', async () => {
    const createBar1Result = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar 1 entity' },
      fields: { title: 'Bar 1 entity' },
    });
    const createBar2Result = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar 2 entity' },
      fields: { title: 'Bar 2 entity' },
    });
    if (expectOkResult(createBar1Result) && expectOkResult(createBar2Result)) {
      const {
        entity: { id: bar1Id },
      } = createBar1Result.value;
      const {
        entity: { id: bar2Id },
      } = createBar2Result.value;

      const publishResult = await client.publishEntities([
        { id: bar1Id, version: 0 },
        { id: bar2Id, version: 0 },
      ]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt: updatedAt1 }, { updatedAt: updatedAt2 }] = publishResult.value;
        expectResultValue(publishResult, [
          { id: bar1Id, publishState: EntityPublishState.Published, updatedAt: updatedAt1 },
          { id: bar2Id, publishState: EntityPublishState.Published, updatedAt: updatedAt2 },
        ]);
      }

      const createBazResult = await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'First name' },
        fields: {
          title: 'First title',
          bar: { id: bar1Id },
          bars: [{ id: bar1Id }, { id: bar2Id }],
        },
      });
      if (expectOkResult(createBazResult)) {
        const {
          entity: { id: bazId },
        } = createBazResult.value;

        const expectedEntity: AdminEntity = {
          id: bazId,
          info: {
            type: 'EntityAdminBaz',
            name: createBazResult.value.entity.info.name,
            version: 0,
            publishingState: EntityPublishState.Draft,
            createdAt: createBazResult.value.entity.info.createdAt,
            updatedAt: createBazResult.value.entity.info.updatedAt,
          },
          fields: {
            ...emptyBazFields,
            title: 'First title',
            bar: { id: bar1Id },
            bars: [{ id: bar1Id }, { id: bar2Id }],
          },
        };

        expectResultValue(createBazResult, { effect: 'created', entity: expectedEntity });

        const updateResult = await client.updateEntity({
          id: bazId,
          fields: { title: 'Updated title' },
        });
        if (expectOkResult(updateResult)) {
          expectedEntity.info.updatedAt = updateResult.value.entity.info.updatedAt;
          expectedEntity.info.version = 1;
          expectedEntity.fields.title = 'Updated title';
        }

        expectResultValue(updateResult, { effect: 'updated', entity: expectedEntity });

        const publishResult = await client.publishEntities([{ id: bazId, version: 1 }]);
        if (expectOkResult(publishResult)) {
          const [{ updatedAt }] = publishResult.value;
          expectResultValue(publishResult, [
            { id: bazId, publishState: EntityPublishState.Published, updatedAt },
          ]);
          expectedEntity.info.publishingState = EntityPublishState.Published;
          expectedEntity.info.updatedAt = updatedAt;
        }

        const version0Result = await client.getEntity({ id: bazId, version: 0 });
        expectResultValue(
          version0Result,
          copyEntity(expectedEntity, { info: { version: 0 }, fields: { title: 'First title' } })
        );

        const version1Result = await client.getEntity({ id: bazId, version: 1 });
        expectResultValue(version1Result, expectedEntity);

        const publishedResult = await publishedClient.getEntity({ id: bazId });
        expectResultValue(publishedResult, {
          id: bazId,
          info: { type: 'EntityAdminBaz', name: expectedEntity.info.name },
          fields: {
            ...emptyBazFields,
            title: 'Updated title',
            bar: { id: bar1Id },
            bars: [{ id: bar1Id }, { id: bar2Id }],
          },
        });
      }
    }
  });

  test('Update archived EntityAdminFoo', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Original' },
      fields: { title: 'Original' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt },
        },
      } = createResult.value;

      const archiveResult = await client.archiveEntity({ id });
      if (expectOkResult(archiveResult)) {
        const { updatedAt } = archiveResult.value;
        expectResultValue(archiveResult, {
          id,
          publishState: EntityPublishState.Archived,
          updatedAt,
        });
      }

      const updateResult = await client.updateEntity({ id, fields: { title: 'Updated title' } });

      if (expectOkResult(updateResult)) {
        const {
          entity: {
            info: { updatedAt },
          },
        } = updateResult.value;
        expectResultValue(updateResult, {
          effect: 'updated',
          entity: {
            id,
            info: {
              type: 'EntityAdminFoo',
              name,
              version: 1,
              publishingState: EntityPublishState.Archived,
              createdAt,
              updatedAt,
            },
            fields: { ...emptyFooFields, title: 'Updated title' },
          },
        });
      }
    }
  });

  test('Update with the same field does not create new version', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo' },
      fields: { title: 'Foo title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;
      const updateResult = await client.updateEntity({ id, fields: { title: 'Foo title' } });
      expectResultValue(updateResult, { effect: 'none', entity: createResult.value.entity });
    }
  });

  test('Update published with the same field does not create new version and returns correct publishing state', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo' },
      fields: { title: 'Foo title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity,
        entity: { id },
      } = createResult.value;

      expectOkResult(await client.publishEntities([{ id, version: 0 }]));

      const updateResult = await client.updateEntity({ id, fields: { title: 'Foo title' } });
      if (expectOkResult(updateResult)) {
        const {
          entity: {
            info: { updatedAt },
          },
        } = updateResult.value;
        expectResultValue(updateResult, {
          effect: 'none',
          entity: copyEntity(entity, {
            info: { publishingState: EntityPublishState.Published, updatedAt },
          }),
        });
      }
    }
  });

  test('Error: Update with invalid id', async () => {
    const result = await client.updateEntity({
      id: 'f773ac54-37db-42df-9b55-b6da8de344c3',
      info: { type: 'EntityAdminFoo', name: 'name' },
      fields: { foo: 'title' },
    });

    expectErrorResult(result, ErrorType.NotFound, 'No such entity');
  });

  test('Error: Update with different type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'foo' },
      fields: { title: 'foo' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;
      const updateResult = await client.updateEntity({
        id,
        info: { type: 'EntityAdminFoo', name: 'name' },
        fields: { foo: 'title' },
      });
      expectErrorResult(
        updateResult,
        ErrorType.BadRequest,
        'New type EntityAdminFoo doesn’t correspond to previous type EntityAdminBar'
      );
    }
  });

  test('Error: Update with invalid field', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo name' },
      fields: { title: 'Foo title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;
      const updateResult = await client.updateEntity({ id, fields: { invalid: 'hello' } });

      expectErrorResult(updateResult, ErrorType.BadRequest, 'Unsupported field names: invalid');
    }
  });

  test('Error: Update EntityAdminFoo with reference to missing entity', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo name' },
      fields: { title: 'Foo title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;
      const updateResult = await client.updateEntity({
        id,
        fields: { bar: { id: '9783ca4f-f5b4-4f6a-a7bf-aae33e227841' } },
      });

      expectErrorResult(
        updateResult,
        ErrorType.BadRequest,
        'entity.fields.bar: referenced entity (9783ca4f-f5b4-4f6a-a7bf-aae33e227841) doesn’t exist'
      );
    }
  });

  test('Error: Update EntityAdminFoo with reference to wrong entity type', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo name' },
      fields: { title: 'Foo title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;
      const referenceId = entitiesOfTypeAdminOnlyEditBefore[0].id;

      const updateResult = await client.updateEntity({ id, fields: { bar: { id: referenceId } } });
      expectErrorResult(
        updateResult,
        ErrorType.BadRequest,
        `entity.fields.bar: referenced entity (${referenceId}) has an invalid type AdminOnlyEditBefore`
      );
    }
  });
});

describe('upsertEntity()', () => {
  test('Create new entity', async () => {
    const id = insecureTestUuidv4();
    const upsertResult = await client.upsertEntity({
      id,
      info: { type: 'EntityAdminBaz', name: 'Baz' },
      fields: {},
    });
    if (expectOkResult(upsertResult)) {
      const {
        entity: {
          info: { name, createdAt, updatedAt },
        },
      } = upsertResult.value;

      const expectedEntity: AdminEntity = {
        id,
        info: {
          name,
          publishingState: EntityPublishState.Draft,
          type: 'EntityAdminBaz',
          version: 0,
          createdAt,
          updatedAt,
        },
        fields: {
          ...emptyBazFields,
        },
      };

      expectResultValue(upsertResult, { effect: 'created', entity: expectedEntity });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  });

  test('Update existing entity', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Original Baz' },
      fields: { title: 'Original title' },
    });

    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { createdAt },
        },
      } = createResult.value;

      const upsertResult = await client.upsertEntity({
        id,
        info: { type: 'EntityAdminBaz', name: 'Updated Baz' },
        fields: { title: 'Updated title' },
      });
      if (expectOkResult(upsertResult)) {
        const {
          entity: {
            info: { name, updatedAt },
          },
        } = upsertResult.value;

        expect(name).toMatch(/^Updated Baz/);
        expectResultValue(upsertResult, {
          effect: 'updated',
          entity: {
            id,
            info: {
              name,
              publishingState: EntityPublishState.Draft,
              type: 'EntityAdminBaz',
              version: 1,
              createdAt,
              updatedAt,
            },
            fields: {
              ...emptyBazFields,
              title: 'Updated title',
            },
          },
        });

        const getResult = await client.getEntity({ id });
        expectResultValue(getResult, upsertResult.value.entity);
      }
    }
  });

  test('Update entity without any change', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Original Baz' },
      fields: { title: 'Original title' },
    });

    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name },
        },
      } = createResult.value;

      const upsertResult = await client.upsertEntity({
        id,
        info: { type: 'EntityAdminBaz', name },
        fields: { title: 'Original title' },
      });
      expectResultValue(upsertResult, {
        effect: 'none',
        entity: createResult.value.entity,
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, createResult.value.entity);
    }
  });

  test('Update entity without any change and same name', async () => {
    // Create another entity to ensure we get a non-unique name
    expectOkResult(
      await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'Non-unique name' },
        fields: { title: 'Original title' },
      })
    );

    const id = insecureTestUuidv4();
    const upsertEntity = {
      id,
      info: { type: 'EntityAdminBaz', name: 'Non-unique name' },
      fields: { title: 'Original title' },
    };

    const createResult = await client.upsertEntity(upsertEntity);
    if (expectOkResult(createResult)) {
      expect(createResult.value.effect).toBe('created');

      const updateResult = await client.upsertEntity(upsertEntity);
      expectResultValue(updateResult, {
        effect: 'none',
        entity: createResult.value.entity,
      });
    }
  });
});

describe('publishEntities()', () => {
  test('Two entities referencing each other', async () => {
    const createBaz1Result = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz 1' },
      fields: {
        title: 'Baz title 1',
      },
    });
    if (expectOkResult(createBaz1Result)) {
      const {
        entity: { id: baz1Id },
      } = createBaz1Result.value;

      const createBaz2Result = await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'Baz 2' },
        fields: {
          title: 'Baz title 2',
          baz: { id: baz1Id },
        },
      });
      if (expectOkResult(createBaz2Result)) {
        const {
          entity: { id: baz2Id },
        } = createBaz2Result.value;

        expectOkResult(await client.updateEntity({ id: baz1Id, fields: { baz: { id: baz2Id } } }));

        const publishResult = await client.publishEntities([
          { id: baz1Id, version: 1 },
          { id: baz2Id, version: 0 },
        ]);
        if (expectOkResult(publishResult)) {
          const [{ updatedAt: updatedAt1 }, { updatedAt: updatedAt2 }] = publishResult.value;
          expectResultValue(publishResult, [
            { id: baz1Id, publishState: EntityPublishState.Published, updatedAt: updatedAt1 },
            { id: baz2Id, publishState: EntityPublishState.Published, updatedAt: updatedAt2 },
          ]);
        }
      }
    }
  });

  test('Archived entity', async () => {
    const createBaz1Result = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz 1' },
      fields: { title: 'Baz title 1' },
    });
    if (expectOkResult(createBaz1Result)) {
      const {
        entity: {
          id,
          info: { name, version, createdAt },
        },
      } = createBaz1Result.value;

      const archiveResult = await client.archiveEntity({ id });
      if (expectOkResult(archiveResult)) {
        const { updatedAt } = archiveResult.value;
        expectResultValue(archiveResult, {
          id,
          publishState: EntityPublishState.Archived,
          updatedAt,
        });
      }

      const publishResult = await client.publishEntities([{ id, version }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          { id, publishState: EntityPublishState.Published, updatedAt },
        ]);
      }

      const getResult = await client.getEntity({ id });
      if (expectOkResult(getResult)) {
        const {
          info: { updatedAt },
        } = getResult.value;
        //TODO should publishEntities return updatedAt?
        expectResultValue(getResult, {
          id,
          info: {
            type: 'EntityAdminBaz',
            name,
            version: 0,
            publishingState: EntityPublishState.Published,
            createdAt,
            updatedAt,
          },
          fields: { ...emptyBazFields, title: 'Baz title 1' },
        });
      }
    }
  });

  test('Error: Publish published version', async () => {
    const createBazResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz 1' },
      fields: { title: 'Baz title 1' },
    });
    if (expectOkResult(createBazResult)) {
      const {
        entity: { id: bazId },
      } = createBazResult.value;

      const firstPublishResult = await client.publishEntities([{ id: bazId, version: 0 }]);
      if (expectOkResult(firstPublishResult)) {
        const [{ updatedAt }] = firstPublishResult.value;
        expectResultValue(firstPublishResult, [
          { id: bazId, publishState: EntityPublishState.Published, updatedAt },
        ]);
      }

      const secondPublishResult = await client.publishEntities([{ id: bazId, version: 0 }]);
      expectErrorResult(
        secondPublishResult,
        ErrorType.BadRequest,
        `Entity versions are already published: ${bazId}`
      );
    }
  });

  test('Error: Reference to unpublished entity', async () => {
    const createBarResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name' },
      fields: {
        title: 'Bar title',
      },
    });
    if (expectOkResult(createBarResult)) {
      const {
        entity: { id: barId },
      } = createBarResult.value;

      const createFooResult = await client.createEntity({
        info: { type: 'EntityAdminFoo', name: 'Foo name' },
        fields: {
          title: 'Foo title',
          bar: { id: barId },
        },
      });
      if (expectOkResult(createFooResult)) {
        const {
          entity: { id: fooId },
        } = createFooResult.value;

        const publishResult = await client.publishEntities([{ id: fooId, version: 0 }]);
        expectErrorResult(
          publishResult,
          ErrorType.BadRequest,
          `${fooId}: References unpublished entities: ${barId}`
        );
      }
    }
  });

  test('Error: Duplicate ids', async () => {
    const publishResult = await client.publishEntities([
      { id: 'b1bdcb61-e6aa-47ff-98d8-4cfe8197b290', version: 0 },
      { id: 'b1bdcb61-e6aa-47ff-98d8-4cfe8197b290', version: 1 },
    ]);
    expectErrorResult(
      publishResult,
      ErrorType.BadRequest,
      'Duplicate ids: b1bdcb61-e6aa-47ff-98d8-4cfe8197b290'
    );
  });

  test('Error: Published unknown entity', async () => {
    const publishResult = await client.publishEntities([
      { id: 'b1bdcb61-e6aa-47ff-98d8-4cfe8197b290', version: 0 },
    ]);
    expectErrorResult(
      publishResult,
      ErrorType.NotFound,
      'No such entities: b1bdcb61-e6aa-47ff-98d8-4cfe8197b290'
    );
  });

  test('Error: Published unknown version', async () => {
    const createFooResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo name' },
      fields: { title: 'Foo title' },
    });
    if (expectOkResult(createFooResult)) {
      const {
        entity: { id: fooId },
      } = createFooResult.value;
      const publishResult = await client.publishEntities([{ id: fooId, version: 100 }]);
      expectErrorResult(publishResult, ErrorType.NotFound, `No such entities: ${fooId}`);
    }
  });
});

describe('unpublishEntities()', () => {
  test('Sets published state to withdrawn', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz 1' },
      fields: { title: 'Baz title 1' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, version, createdAt },
        },
      } = createResult.value;

      const publishResult = await client.publishEntities([{ id, version }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          { id, publishState: EntityPublishState.Published, updatedAt },
        ]);
      }

      const unpublishResult = await client.unpublishEntities([{ id }]);
      if (expectOkResult(unpublishResult)) {
        const [{ updatedAt }] = unpublishResult.value;
        expectResultValue(unpublishResult, [
          { id, publishState: EntityPublishState.Withdrawn, updatedAt },
        ]);
      }

      const getResult = await client.getEntity({ id });
      if (expectOkResult(getResult)) {
        //TODO should unpublishEntities return updatedAt?
        const {
          info: { updatedAt },
        } = getResult.value;
        expectResultValue(getResult, {
          id,
          info: {
            type: 'EntityAdminBaz',
            name,
            version: 0,
            publishingState: EntityPublishState.Withdrawn,
            createdAt,
            updatedAt,
          },
          fields: { ...emptyBazFields, title: 'Baz title 1' },
        });
      }
    }
  });

  test('Two published entities referencing each other', async () => {
    const createBaz1Result = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz 1' },
      fields: { title: 'Baz title 1' },
    });
    if (expectOkResult(createBaz1Result)) {
      const {
        entity: { id: baz1Id },
      } = createBaz1Result.value;

      const createBaz2Result = await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'Baz 2' },
        fields: { title: 'Baz title 2', baz: { id: baz1Id } },
      });
      if (expectOkResult(createBaz2Result)) {
        const {
          entity: { id: baz2Id },
        } = createBaz2Result.value;

        expectOkResult(await client.updateEntity({ id: baz1Id, fields: { baz: { id: baz2Id } } }));

        const publishResult = await client.publishEntities([
          { id: baz1Id, version: 1 },
          { id: baz2Id, version: 0 },
        ]);
        if (expectOkResult(publishResult)) {
          const [{ updatedAt: updatedAt1 }, { updatedAt: updatedAt2 }] = publishResult.value;
          expectResultValue(publishResult, [
            { id: baz1Id, publishState: EntityPublishState.Published, updatedAt: updatedAt1 },
            { id: baz2Id, publishState: EntityPublishState.Published, updatedAt: updatedAt2 },
          ]);
        }

        const unpublishResult = await client.unpublishEntities([{ id: baz1Id }, { id: baz2Id }]);
        if (expectOkResult(unpublishResult)) {
          const [{ updatedAt: updatedAt1 }, { updatedAt: updatedAt2 }] = unpublishResult.value;
          expectResultValue(unpublishResult, [
            { id: baz1Id, publishState: EntityPublishState.Withdrawn, updatedAt: updatedAt1 },
            { id: baz2Id, publishState: EntityPublishState.Withdrawn, updatedAt: updatedAt2 },
          ]);
        }
      }
    }
  });

  test('Unpublished entity referencing', async () => {
    const createBaz1Result = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz 1' },
      fields: {
        title: 'Baz title 1',
      },
    });
    if (expectOkResult(createBaz1Result)) {
      const {
        entity: { id: baz1Id },
      } = createBaz1Result.value;

      const createBaz2Result = await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'Baz 2' },
        fields: {
          title: 'Baz title 2',
          baz: { id: baz1Id },
        },
      });
      if (expectOkResult(createBaz2Result)) {
        const publishResult = await client.publishEntities([{ id: baz1Id, version: 0 }]);
        if (expectOkResult(publishResult)) {
          const [{ updatedAt }] = publishResult.value;
          expectResultValue(publishResult, [
            { id: baz1Id, publishState: EntityPublishState.Published, updatedAt },
          ]);
        }

        const unpublishResult = await client.unpublishEntities([{ id: baz1Id }]);
        if (expectOkResult(unpublishResult)) {
          const [{ updatedAt }] = unpublishResult.value;
          expectResultValue(unpublishResult, [
            { id: baz1Id, publishState: EntityPublishState.Withdrawn, updatedAt },
          ]);
        }
      }
    }
  });

  test('Error: invalid id', async () => {
    const publishResult = await client.unpublishEntities([
      { id: '8a678bad-fa57-4f18-a377-633f704fd0d3' },
    ]);
    expectErrorResult(
      publishResult,
      ErrorType.NotFound,
      `No such entities: 8a678bad-fa57-4f18-a377-633f704fd0d3`
    );
  });

  test('Error: Reference from published entity', async () => {
    const createBarResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createBarResult)) {
      const {
        entity: { id: barId },
      } = createBarResult.value;

      const createFooResult = await client.createEntity({
        info: { type: 'EntityAdminFoo', name: 'Foo name' },
        fields: {
          title: 'Foo title',
          bar: { id: barId },
        },
      });
      if (expectOkResult(createFooResult)) {
        const {
          entity: { id: fooId },
        } = createFooResult.value;

        const publishResult = await client.publishEntities([
          { id: fooId, version: 0 },
          { id: barId, version: 0 },
        ]);
        if (expectOkResult(publishResult)) {
          const [{ updatedAt: fooUpdatedAt }, { updatedAt: barUpdatedAt }] = publishResult.value;
          expectResultValue(publishResult, [
            { id: fooId, publishState: EntityPublishState.Published, updatedAt: fooUpdatedAt },
            { id: barId, publishState: EntityPublishState.Published, updatedAt: barUpdatedAt },
          ]);
        }

        const unpublishResult = await client.unpublishEntities([{ id: barId }]);
        expectErrorResult(
          unpublishResult,
          ErrorType.BadRequest,
          `${barId}: Published entities referencing entity: ${fooId}`
        );
      }
    }
  });

  test('Error: Unpublished entity', async () => {
    const createBarResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createBarResult)) {
      const {
        entity: { id: barId },
      } = createBarResult.value;

      const publishResult = await client.unpublishEntities([{ id: barId }]);
      expectErrorResult(
        publishResult,
        ErrorType.BadRequest,
        `Entities are not published: ${barId}`
      );
    }
  });

  test('Error: Unpublish archived entity', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz 1' },
      fields: { title: 'Baz title 1' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const archiveResult = await client.archiveEntity({ id });
      if (expectOkResult(archiveResult)) {
        const { updatedAt } = archiveResult.value;
        expectResultValue(archiveResult, {
          id,
          publishState: EntityPublishState.Archived,
          updatedAt,
        });
      }

      expectErrorResult(
        await client.unpublishEntities([{ id }]),
        ErrorType.BadRequest,
        `Entities are not published: ${id}`
      );
    }
  });

  test('Error: duplicate ids', async () => {
    const unpublishResult = await client.unpublishEntities([
      { id: 'b1bdcb61-e6aa-47ff-98d8-4cfe8197b290' },
      { id: 'b1bdcb61-e6aa-47ff-98d8-4cfe8197b290' },
    ]);
    expectErrorResult(
      unpublishResult,
      ErrorType.BadRequest,
      'Duplicate ids: b1bdcb61-e6aa-47ff-98d8-4cfe8197b290'
    );
  });
});

describe('archiveEntity()', () => {
  test('Archive new entity', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt },
        },
      } = createResult.value;

      const archiveResult = await client.archiveEntity({ id });
      if (expectOkResult(archiveResult)) {
        const { updatedAt } = archiveResult.value;
        expectResultValue(archiveResult, {
          id,
          publishState: EntityPublishState.Archived,
          updatedAt,
        });
      }

      const historyResult = await client.getPublishingHistory({ id });
      if (expectOkResult(historyResult)) {
        const { publishedAt } = historyResult.value.events[0];
        expectResultValue(historyResult, {
          id,
          events: [
            {
              kind: PublishingEventKind.Archive,
              publishedAt,
              publishedBy: context.session.subjectId,
              version: null,
            },
          ],
        });
      }

      const getResult = await client.getEntity({ id });
      if (expectOkResult(getResult)) {
        //TODO should archiveEntity return updatedAt?
        const {
          info: { updatedAt },
        } = getResult.value;
        expectResultValue(getResult, {
          id,
          info: {
            name,
            type: 'EntityAdminBar',
            version: 0,
            publishingState: EntityPublishState.Archived,
            createdAt,
            updatedAt,
          },
          fields: { title: 'Bar title' },
        });
      }
    }
  });

  test('Archive archived entity', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const archiveResult1 = await client.archiveEntity({ id });
      if (expectOkResult(archiveResult1)) {
        const { updatedAt } = archiveResult1.value;
        expectResultValue(archiveResult1, {
          id,
          publishState: EntityPublishState.Archived,
          updatedAt,
        });
      }

      const archiveResult2 = await client.archiveEntity({ id });
      if (expectOkResult(archiveResult2)) {
        const { updatedAt } = archiveResult2.value;
        expectResultValue(archiveResult2, {
          id,
          publishState: EntityPublishState.Archived,
          updatedAt,
        });
      }

      const historyResult = await client.getPublishingHistory({ id });
      if (expectOkResult(historyResult)) {
        expect(historyResult.value.events).toHaveLength(1); // no event created by second archive
      }
    }
  });

  test('Error: archive published entity', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { version },
        },
      } = createResult.value;

      const publishResult = await client.publishEntities([{ id, version }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          { id, publishState: EntityPublishState.Published, updatedAt },
        ]);
      }

      const archiveResult = await client.archiveEntity({ id });
      expectErrorResult(archiveResult, ErrorType.BadRequest, 'Entity is published');
    }
  });

  test('Error: archive with invalid id', async () => {
    const result = await client.archiveEntity({ id: '5b14e69f-6612-4ddb-bb42-7be273104486' });
    expectErrorResult(result, ErrorType.NotFound, 'No such entity');
  });
});

describe('unarchiveEntity()', () => {
  test('Unarchive new entity (does nothing)', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const unarchiveResult = await client.unarchiveEntity({ id });
      if (expectOkResult(unarchiveResult)) {
        const { updatedAt } = unarchiveResult.value;
        expectResultValue(unarchiveResult, {
          id,
          publishState: EntityPublishState.Draft,
          updatedAt,
        });
      }

      const historyResult = await client.getPublishingHistory({ id });
      expectResultValue(historyResult, { id, events: [] });
    }
  });

  test('Unarchive archived entity', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt },
        },
      } = createResult.value;

      const archiveResult = await client.archiveEntity({ id });
      if (expectOkResult(archiveResult)) {
        const { updatedAt } = archiveResult.value;
        expectResultValue(archiveResult, {
          id,
          publishState: EntityPublishState.Archived,
          updatedAt,
        });
      }

      const unarchiveResult = await client.unarchiveEntity({ id });
      if (expectOkResult(unarchiveResult)) {
        const { updatedAt } = unarchiveResult.value;
        expectResultValue(unarchiveResult, {
          id,
          publishState: EntityPublishState.Draft,
          updatedAt,
        });
      }

      const historyResult = await client.getPublishingHistory({ id });
      if (expectOkResult(historyResult)) {
        const { publishedAt: publishedAt0 } = historyResult.value.events[0];
        const { publishedAt: publishedAt1 } = historyResult.value.events[1];
        expectResultValue(historyResult, {
          id,
          events: [
            {
              kind: PublishingEventKind.Archive,
              publishedAt: publishedAt0,
              publishedBy: context.session.subjectId,
              version: null,
            },
            {
              kind: PublishingEventKind.Unarchive,
              publishedAt: publishedAt1,
              publishedBy: context.session.subjectId,
              version: null,
            },
          ],
        });
      }

      const getResult = await client.getEntity({ id });
      if (expectOkResult(getResult)) {
        //TODO should unarchiveEntity return updatedAt?
        const {
          info: { updatedAt },
        } = getResult.value;
        expectResultValue(getResult, {
          id,
          info: {
            name,
            type: 'EntityAdminBar',
            version: 0,
            publishingState: EntityPublishState.Draft,
            createdAt,
            updatedAt,
          },
          fields: { title: 'Bar title' },
        });
      }
    }
  });

  test('Unarchive once published, then archived entity', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { version },
        },
      } = createResult.value;

      const publishResult = await client.publishEntities([{ id, version }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          { id, publishState: EntityPublishState.Published, updatedAt },
        ]);
      }

      const unpublishResult = await client.unpublishEntities([{ id }]);
      if (expectOkResult(unpublishResult)) {
        const [{ updatedAt }] = unpublishResult.value;
        expectResultValue(unpublishResult, [
          { id, publishState: EntityPublishState.Withdrawn, updatedAt },
        ]);
      }

      const archiveResult = await client.archiveEntity({ id });
      if (expectOkResult(archiveResult)) {
        const { updatedAt } = archiveResult.value;
        expectResultValue(archiveResult, {
          id,
          publishState: EntityPublishState.Archived,
          updatedAt,
        });
      }

      const unarchiveResult = await client.unarchiveEntity({ id });
      if (expectOkResult(unarchiveResult)) {
        const { updatedAt } = unarchiveResult.value;
        expectResultValue(unarchiveResult, {
          id,
          publishState: EntityPublishState.Withdrawn,
          updatedAt,
        });
      }
    }
  });

  test('Error: unarchive with invalid id', async () => {
    const result = await client.unarchiveEntity({
      id: '5b14e69f-6612-4ddb-bb42-7be273104486',
    });
    expectErrorResult(result, ErrorType.NotFound, 'No such entity');
  });
});

describe('getEntityHistory()', () => {
  // rest is tested elsewhere

  test('Error: Get version history with invalid id', async () => {
    const result = await client.getEntityHistory({
      id: '5b14e69f-6612-4ddb-bb42-7be273104486',
    });
    expectErrorResult(result, ErrorType.NotFound, 'No such entity');
  });
});

describe('getPublishingHistory()', () => {
  test('New unpublished entity', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Unpublished' },
      fields: {},
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;
      const historyResult = await client.getPublishingHistory({ id });
      expectResultValue(historyResult, { id, events: [] });
    }
  });

  test('One published version', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Published' },
      fields: {},
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const publishResult = await client.publishEntities([{ id, version: 0 }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          { id, publishState: EntityPublishState.Published, updatedAt },
        ]);
      }

      const historyResult = await client.getPublishingHistory({ id });
      if (expectOkResult(historyResult)) {
        const { publishedAt } = historyResult.value.events[0];
        expectResultValue(historyResult, {
          id,
          events: [
            {
              kind: PublishingEventKind.Publish,
              publishedAt,
              publishedBy: context.session.subjectId,
              version: 0,
            },
          ],
        });
      }
    }
  });

  test('One unpublished version', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Published/Unpublished' },
      fields: {},
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const publishResult = await client.publishEntities([{ id, version: 0 }]);
      if (expectOkResult(publishResult)) {
        const [{ updatedAt }] = publishResult.value;
        expectResultValue(publishResult, [
          { id, publishState: EntityPublishState.Published, updatedAt },
        ]);
      }

      const unpublishResult = await client.unpublishEntities([{ id }]);
      if (expectOkResult(unpublishResult)) {
        const [{ updatedAt }] = unpublishResult.value;
        expectResultValue(unpublishResult, [
          { id, publishState: EntityPublishState.Withdrawn, updatedAt },
        ]);
      }

      const historyResult = await client.getPublishingHistory({ id });
      if (expectOkResult(historyResult)) {
        const publishedAt0 = historyResult.value.events[0]?.publishedAt;
        const publishedAt1 = historyResult.value.events[1]?.publishedAt;
        expectResultValue(historyResult, {
          id,
          events: [
            {
              kind: PublishingEventKind.Publish,
              publishedAt: publishedAt0,
              publishedBy: context.session.subjectId,
              version: 0,
            },
            {
              kind: PublishingEventKind.Unpublish,
              publishedAt: publishedAt1,
              publishedBy: context.session.subjectId,
              version: null,
            },
          ],
        });
      }
    }
  });

  test('Error: Get publish history with invalid id', async () => {
    const result = await client.getPublishingHistory({
      id: '5b14e69f-6612-4ddb-bb42-7be273104486',
    });
    expectErrorResult(result, ErrorType.NotFound, 'No such entity');
  });
});
