import {
  CoreTestUtils,
  EntityPublishState,
  ErrorType,
  FieldType,
  isPagingForwards,
  PublishingEventKind,
  RichTextBlockType,
} from '@jonasb/datadata-core';
import type {
  AdminClient,
  AdminEntity,
  AdminQuery,
  BoundingBox,
  Connection,
  Edge,
  Paging,
  PublishedClient,
} from '@jonasb/datadata-core';
import { validate as validateUuid } from 'uuid';
import type { Server, SessionContext } from '.';
import { createServerAdminClient, createServerPublishedClient } from '.';
import { createTestServer, ensureSessionContext, updateSchema } from './ServerTestUtils';
import {
  expectEntityHistoryVersions,
  expectResultValue,
  expectSearchResultEntities,
  insecureTestUuidv4,
} from './test/AdditionalTestUtils';

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
  server = await createTestServer();
  context = await ensureSessionContext(server, 'test', 'entity-admin');
  client = createServerAdminClient({ context });
  publishedClient = createServerPublishedClient({ context });
  await updateSchema(context, {
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
        const publishResult = await client.publishEntities([
          { id: createResult.value.id, version: createResult.value.info.version },
        ]);
        publishResult.throwIfError();
      }
    }
  }
}

async function getEntitiesForAdminOnlyEditBefore(client: AdminClient) {
  const entities: AdminEntity[] = [];
  await visitAllEntityPages(
    client,
    { entityTypes: ['AdminOnlyEditBefore'] },
    { first: 100 },
    (connection) => {
      for (const edge of connection.edges) {
        if (edge.node.isOk()) {
          const entity = edge.node.value;
          entities.push(entity);
        }
      }
    }
  );
  return { entities };
}

async function visitAllEntityPages(
  client: AdminClient,
  query: AdminQuery,
  paging: Paging,
  visitor: (connection: Connection<Edge<AdminEntity, ErrorType>>) => void
) {
  const ownPaging = { ...paging };
  const isForwards = isPagingForwards(ownPaging);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await client.searchEntities(query, ownPaging);
    if (result.isError()) {
      throw result.toError();
    }
    if (result.value === null) {
      return;
    }

    visitor(result.value);

    if (isForwards) {
      ownPaging.after = result.value.pageInfo.endCursor;
      if (!result.value.pageInfo.hasNextPage) {
        return;
      }
    } else {
      ownPaging.before = result.value.pageInfo.startCursor;
      if (!result.value.pageInfo.hasPreviousPage) {
        return;
      }
    }
  }
}

async function countSearchResultWithEntity(query: AdminQuery, entityId: string) {
  let matchCount = 0;

  await visitAllEntityPages(client, query, { first: 50 }, (connection) => {
    for (const edge of connection.edges) {
      if (edge.node.isOk() && edge.node.value.id === entityId) {
        matchCount += 1;
      }
    }
  });

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

  const { id: barId } = createBarResult.value;

  const fooEntities: AdminEntity[] = [];
  const bazEntities: AdminEntity[] = [];

  for (let i = 0; i < fooCount; i += 1) {
    const createFooResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo: ' + i },
      fields: { bar: { id: barId } },
    });
    if (expectOkResult(createFooResult)) {
      fooEntities.push(createFooResult.value);
    }
  }
  for (let i = 0; i < bazCount; i += 1) {
    const bars = [...new Array(bazReferencesPerEntity - 1)].map(() => ({ id: barId }));
    const createBazResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz: ' + i },
      fields: { bar: { id: barId }, bars },
    });
    if (expectOkResult(createBazResult)) {
      bazEntities.push(createBazResult.value);
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
      const { id } = createResult.value;
      const updateResult = await client.updateEntity({ id, fields: { title: 'Updated title' } });
      expectOkResult(updateResult);

      const versionMaxResult = await client.getEntity({ id });
      expectResultValue(versionMaxResult, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name: createResult.value.info.name,
          version: 1,
          publishingState: EntityPublishState.Draft,
        },
        fields: { ...emptyFooFields, title: 'Updated title' },
      });
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
      const { id } = createResult.value;

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
        id: foo1Id,
        info: { name: foo1Name },
      } = createFoo1Result.value;
      const {
        id: foo2Id,
        info: { name: foo2Name },
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
        id: fooId,
        info: { name: fooName },
      } = createFooResult.value;

      expectOkResult(await client.updateEntity({ id: fooId, fields: { title: 'Updated title' } }));

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
          },
          fields: { ...emptyFooFields, title: 'Updated title' },
        });
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
        id,
        info: { name },
      } = createResult.value;
      expect(validateUuid(id)).toBeTruthy();
      expect(name).toMatch(/^Foo(#[0-9]+)?$/);

      expectResultValue(createResult, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
        },
        fields: { ...emptyFooFields, title: 'Title' },
      });

      const publishResult = await client.publishEntities([{ id, version: 0 }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

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
      expectResultValue(version0Result, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name: name,
          version: 0,
          publishingState: EntityPublishState.Published,
        },
        fields: { ...emptyFooFields, title: 'Title' },
      });

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
      expect(validateUuid(createResult.value.id)).toBeTruthy();
      const {
        id,
        info: { name },
      } = createResult.value;

      expectResultValue(createResult, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
        },
        fields: { ...emptyFooFields, title: 'Draft' },
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
          name: createResult.value.info.name,
          version: 0,
          publishingState: EntityPublishState.Draft,
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
        info: { name },
      } = createResult.value;
      expectResultValue(createResult, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
        },
        fields: { ...emptyFooFields, title: 'Draft' },
      });
    }
  });

  test('Create EntityAdminFoo with reference to Bar', async () => {
    const createBarResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createBarResult)) {
      const barId = createBarResult.value.id;

      const createFooResult = await client.createEntity({
        info: { type: 'EntityAdminFoo', name: 'Foo name' },
        fields: { title: 'Foo title', bar: { id: barId } },
      });
      if (expectOkResult(createFooResult)) {
        expect(validateUuid(createFooResult.value.id)).toBeTruthy();
        const {
          id: fooId,
          info: { name },
        } = createFooResult.value;

        expectResultValue(createFooResult, {
          id: fooId,
          info: {
            type: 'EntityAdminFoo',
            name,
            version: 0,
            publishingState: EntityPublishState.Draft,
          },
          fields: {
            ...emptyFooFields,
            title: 'Foo title',
            bar: { id: barId },
          },
        });

        const publishResult = await client.publishEntities([
          { id: fooId, version: 0 },
          { id: barId, version: 0 },
        ]);
        expectResultValue(publishResult, [
          { id: fooId, publishState: EntityPublishState.Published },
          { id: barId, publishState: EntityPublishState.Published },
        ]);

        const fooVersion0Result = await client.getEntity({ id: fooId, version: 0 });
        expectResultValue(fooVersion0Result, {
          id: fooId,
          info: {
            type: 'EntityAdminFoo',
            name: createFooResult.value.info.name,
            version: 0,
            publishingState: EntityPublishState.Published,
          },
          fields: {
            ...emptyFooFields,
            title: 'Foo title',
            bar: { id: barId },
          },
        });

        const publishedFooResult = await publishedClient.getEntity({ id: fooId });
        expectResultValue(publishedFooResult, {
          id: fooId,
          info: { type: 'EntityAdminFoo', name: createFooResult.value.info.name },
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
        id,
        info: { name },
      } = createResult.value;
      expectResultValue(createResult, {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
        },
        fields: { ...emptyBazFields, tags: ['one', 'two', 'three'] },
      });

      const getResult = await client.getEntity({ id });
      if (expectOkResult(getResult)) {
        expectResultValue(getResult, {
          id,
          info: {
            type: 'EntityAdminBaz',
            name,
            version: 0,
            publishingState: EntityPublishState.Draft,
          },
          fields: { ...emptyBazFields, tags: ['one', 'two', 'three'] },
        });
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
        id,
        info: { name },
      } = createResult.value;
      expectResultValue(createResult, {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
        },
        fields: { ...emptyBazFields, active: true, activeList: [true, false, true] },
      });

      const getResult = await client.getEntity({ id });
      if (expectOkResult(getResult)) {
        expectResultValue(getResult, {
          id,
          info: {
            type: 'EntityAdminBaz',
            name,
            version: 0,
            publishingState: EntityPublishState.Draft,
          },
          fields: { ...emptyBazFields, active: true, activeList: [true, false, true] },
        });
      }
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
        id,
        info: { name },
      } = createResult.value;
      expectResultValue(createResult, {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
        },
        fields: {
          ...emptyBazFields,
          body: { blocks: [{ type: 'paragraph', data: { text: 'Hello world' } }] },
          bodyList: [
            { blocks: [{ type: 'paragraph', data: { text: 'First rich text' } }] },
            { blocks: [{ type: 'paragraph', data: { text: 'Second rich text' } }] },
          ],
        },
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
        },
        fields: {
          ...emptyBazFields,
          body: { blocks: [{ type: 'paragraph', data: { text: 'Hello world' } }] },
          bodyList: [
            { blocks: [{ type: 'paragraph', data: { text: 'First rich text' } }] },
            { blocks: [{ type: 'paragraph', data: { text: 'Second rich text' } }] },
          ],
        },
      });
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
      const { id: bar1Id } = createBar1Result.value;
      const { id: bar2Id } = createBar2Result.value;

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
        const baz = createBazResult.value;
        const {
          id: bazId,
          info: { name: bazName },
        } = createBazResult.value;
        expectResultValue(createBazResult, {
          id: bazId,
          info: {
            type: 'EntityAdminBaz',
            name: bazName,
            version: 0,
            publishingState: EntityPublishState.Draft,
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
        });

        const getResult = await client.getEntity({ id: bazId });
        expectResultValue(getResult, {
          id: bazId,
          info: {
            type: 'EntityAdminBaz',
            name: bazName,
            version: 0,
            publishingState: EntityPublishState.Draft,
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
        });

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
        id,
        info: { name },
      } = createResult.value;
      expectResultValue(createResult, {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
        },
        fields: {
          ...emptyBazFields,
          location: { lat: 55.60498, lng: 13.003822 },
          locations: [
            { lat: 55.60498, lng: 13.003822 },
            { lat: 56.381561, lng: 13.99286 },
          ],
        },
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
        },
        fields: {
          ...emptyBazFields,
          location: { lat: 55.60498, lng: 13.003822 },
          locations: [
            { lat: 55.60498, lng: 13.003822 },
            { lat: 56.381561, lng: 13.99286 },
          ],
        },
      });
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
      const { id: bar1Id } = createBar1Result.value;
      const { id: bar2Id } = createBar2Result.value;

      const createBazResult = await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'Baz' },
        fields: { bars: [{ id: bar1Id }, { id: bar2Id }] },
      });
      if (expectOkResult(createBazResult)) {
        const baz = createBazResult.value;
        const {
          id,
          info: { name },
        } = createBazResult.value;
        expectResultValue(createBazResult, {
          id,
          info: {
            type: 'EntityAdminBaz',
            name: name,
            version: 0,
            publishingState: EntityPublishState.Draft,
          },
          fields: { ...emptyBazFields, bars: [{ id: bar1Id }, { id: bar2Id }] },
        });

        const getResult = await client.getEntity({ id });
        expectResultValue(getResult, {
          id,
          info: {
            type: 'EntityAdminBaz',
            name,
            version: 0,
            publishingState: EntityPublishState.Draft,
          },
          fields: { ...emptyBazFields, bars: [{ id: bar1Id }, { id: bar2Id }] },
        });

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
        id,
        info: { name },
      } = createResult.value;
      expectResultValue(createResult, {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
        },
        fields: {
          ...emptyBazFields,
          twoStrings: { type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' },
        },
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
        },
        fields: {
          ...emptyBazFields,
          twoStrings: { type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' },
        },
      });
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
        id,
        info: { name },
      } = createResult.value;
      expectResultValue(createResult, {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
        },
        fields: {
          ...emptyBazFields,
          twoStringsList: [
            { type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' },
            { type: 'EntityAdminTwoStrings', one: 'Three', two: 'Four' },
          ],
        },
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
        },
        fields: {
          ...emptyBazFields,
          twoStringsList: [
            { type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' },
            { type: 'EntityAdminTwoStrings', one: 'Three', two: 'Four' },
          ],
        },
      });
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
        id,
        info: { name },
      } = createResult.value;
      expectResultValue(createResult, {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
        },
        fields: {
          ...emptyBazFields,
          booleanString: { type: 'EntityAdminBooleanString', boolean: true, string: 'String' },
        },
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          publishingState: EntityPublishState.Draft,
        },
        fields: {
          ...emptyBazFields,
          booleanString: { type: 'EntityAdminBooleanString', boolean: true, string: 'String' },
        },
      });
    }
  });

  test('Create EntityAdminBaz with EntityAdminStringReference value type', async () => {
    const createBarResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar' },
      fields: {},
    });
    if (expectOkResult(createBarResult)) {
      const { id: barId } = createBarResult.value;

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
        const baz = createBazResult.value;
        const {
          id: bazId,
          info: { name: bazName },
        } = createBazResult.value;
        expectResultValue(createBazResult, {
          id: bazId,
          info: {
            type: 'EntityAdminBaz',
            name: bazName,
            version: 0,
            publishingState: EntityPublishState.Draft,
          },
          fields: {
            ...emptyBazFields,
            stringReference: {
              type: 'EntityAdminStringReference',
              string: 'Hello string',
              reference: { id: barId },
            },
          },
        });

        const getResult = await client.getEntity({ id: bazId });
        expectResultValue(getResult, {
          id: bazId,
          info: {
            type: 'EntityAdminBaz',
            name: bazName,
            version: 0,
            publishingState: EntityPublishState.Draft,
          },
          fields: {
            ...emptyBazFields,
            stringReference: {
              type: 'EntityAdminStringReference',
              string: 'Hello string',
              reference: { id: barId },
            },
          },
        });

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
      const { id: bar1Id } = createBar1Result.value;
      const { id: bar2Id } = createBar2Result.value;

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
          id: bazId,
          info: { name: bazName },
        } = createBazResult.value;
        expectResultValue(createBazResult, {
          id: bazId,
          info: {
            type: 'EntityAdminBaz',
            name: bazName,
            version: 0,
            publishingState: EntityPublishState.Draft,
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
        });

        const getResult = await client.getEntity({ id: bazId });
        expectResultValue(getResult, {
          id: bazId,
          info: {
            type: 'EntityAdminBaz',
            name: bazName,
            version: 0,
            publishingState: EntityPublishState.Draft,
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
        });

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
        id: bazId,
        info: { name: bazName },
      } = createResult.value;
      expectResultValue(createResult, {
        id: bazId,
        info: {
          type: 'EntityAdminBaz',
          name: bazName,
          version: 0,
          publishingState: EntityPublishState.Draft,
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
              },
            },
          },
        },
      });

      const getResult = await client.getEntity({ id: bazId });
      expectResultValue(getResult, {
        id: bazId,
        info: {
          type: 'EntityAdminBaz',
          name: bazName,
          version: 0,
          publishingState: EntityPublishState.Draft,
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
              },
            },
          },
        },
      });
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

  test('First default, ordered by name', async () => {
    const result = await client.searchEntities(
      {
        entityTypes: ['AdminOnlyEditBefore'],
        order: 'name',
      },
      { first: 20 }
    );
    if (expectOkResult(result)) {
      expectConnectionToMatchSlice(result.value, 0, 20, (a, b) => {
        return a.info.name < b.info.name ? -1 : 1;
      });
    }
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
      const { id: fooId } = createResult.value;
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
      const { id: fooId } = createResult.value;
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
      const { id: fooId } = createResult.value;
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
        id: bazId,
        info: { name: bazName },
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
      const { id: fooId } = createResult.value;

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
      const { id } = createResult.value;
      let { name } = createResult.value.info;

      const updateResult = await client.updateEntity({
        id,
        info: { type: 'EntityAdminFoo', name: 'Updated name' },
        fields: { title: 'Updated title' },
      });
      if (expectOkResult(updateResult)) {
        name = updateResult.value.info.name;
        expect(name).toMatch(/^Updated name(#[0-9]+)?$/);

        expectResultValue(updateResult, {
          id,
          info: {
            type: 'EntityAdminFoo',
            name: name,
            version: 1,
            publishingState: EntityPublishState.Draft,
          },
          fields: {
            ...emptyFooFields,
            title: 'Updated title',
          },
        });
      }

      const publishResult = await client.publishEntities([{ id, version: 1 }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

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
      expectResultValue(version0Result, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name, // original name isn't kept
          version: 0,
          publishingState: EntityPublishState.Published,
        },
        fields: { ...emptyFooFields, title: 'Original' },
      });

      const version1Result = await client.getEntity({ id, version: 1 });
      expectResultValue(version1Result, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name,
          version: 1,
          publishingState: EntityPublishState.Published,
        },
        fields: { ...emptyFooFields, title: 'Updated title' },
      });

      const publishedResult = await publishedClient.getEntity({ id });
      expectResultValue(publishedResult, {
        id,
        info: { type: 'EntityAdminFoo', name },
        fields: { ...emptyFooFields, title: 'Updated title' },
      });
    }
  });

  test('Update EntityAdminFoo w/o publish', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'First' },
      fields: { title: 'First' },
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;
      let { name } = createResult.value.info;

      const publishResult = await client.publishEntities([{ id, version: 0 }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

      const updateResult = await client.updateEntity({
        id,
        info: { type: 'EntityAdminFoo', name: 'Updated name' },
        fields: { title: 'Updated title' },
      });
      if (expectOkResult(updateResult)) {
        name = updateResult.value.info.name;
        expect(name).toMatch(/^Updated name(#[0-9]+)?$/);

        expectResultValue(updateResult, {
          id,
          info: {
            type: 'EntityAdminFoo',
            name: name,
            version: 1,
            publishingState: EntityPublishState.Modified,
          },
          fields: {
            ...emptyFooFields,
            title: 'Updated title',
          },
        });
      }

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
      expectResultValue(version0Result, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name,
          version: 0,
          publishingState: EntityPublishState.Modified,
        },
        fields: { ...emptyFooFields, title: 'First' },
      });

      const version1Result = await client.getEntity({ id, version: 1 });
      expectResultValue(version1Result, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name,
          version: 1,
          publishingState: EntityPublishState.Modified,
        },
        fields: { ...emptyFooFields, title: 'Updated title' },
      });

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
  });

  test('Update EntityAdminFoo w/o type and name', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Original' },
      fields: { title: 'Original' },
    });
    if (expectOkResult(createResult)) {
      const {
        id,
        info: { name },
      } = createResult.value;

      const updateResult = await client.updateEntity({ id, fields: { title: 'Updated title' } });
      expectResultValue(updateResult, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name,
          version: 1,
          publishingState: EntityPublishState.Draft,
        },
        fields: {
          ...emptyFooFields,
          title: 'Updated title',
        },
      });

      const publishResult = await client.publishEntities([{ id, version: 1 }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

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
      expectResultValue(version0Result, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name,
          version: 0,
          publishingState: EntityPublishState.Published,
        },
        fields: { ...emptyFooFields, title: 'Original' },
      });

      const version1Result = await client.getEntity({ id, version: 1 });
      expectResultValue(version1Result, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name,
          version: 1,
          publishingState: EntityPublishState.Published,
        },
        fields: { ...emptyFooFields, title: 'Updated title' },
      });

      const publishedResult = await publishedClient.getEntity({ id });
      expectResultValue(publishedResult, {
        id,
        info: { type: 'EntityAdminFoo', name },
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
        id,
        info: { name },
      } = createResult.value;

      const updateResult = await client.updateEntity({
        id,
        fields: { summary: 'Updated summary' },
      });
      expectResultValue(updateResult, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name,
          version: 1,
          publishingState: EntityPublishState.Draft,
        },
        fields: {
          ...emptyFooFields,
          title: 'First title',
          summary: 'Updated summary',
        },
      });

      const publishResult = await client.publishEntities([{ id, version: 1 }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

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
      expectResultValue(version0Result, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name: name,
          version: 0,
          publishingState: EntityPublishState.Published,
        },
        fields: { ...emptyFooFields, title: 'First title', summary: 'First summary' },
      });

      const version1Result = await client.getEntity({ id, version: 1 });
      expectResultValue(version1Result, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name: name,
          version: 1,
          publishingState: EntityPublishState.Published,
        },
        fields: { ...emptyFooFields, title: 'First title', summary: 'Updated summary' },
      });

      const publishedResult = await publishedClient.getEntity({ id });
      expectResultValue(publishedResult, {
        id,
        info: { type: 'EntityAdminFoo', name },
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
        id,
        info: { name },
      } = createResult.value;

      const updateResult = await client.updateEntity({ id, info: { name }, fields: {} });
      expectResultValue(updateResult, createResult.value);

      const publishResult = await client.publishEntities([{ id, version: 0 }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

      const publishedResult = await publishedClient.getEntity({ id });
      expectResultValue(publishedResult, {
        id,
        info: { type: 'EntityAdminFoo', name },
        fields: { ...emptyFooFields, title: 'First title', summary: 'First summary' },
      });
    }
  });

  test('Update EntityAdminFoo with reference', async () => {
    const createFooResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'First name' },
      fields: { title: 'First title', summary: 'First summary' },
    });
    if (expectOkResult(createFooResult)) {
      const { id: fooId } = createFooResult.value;

      const createBarResult = await client.createEntity({
        info: { type: 'EntityAdminBar', name: 'Bar entity' },
        fields: { title: 'Bar entity' },
      });
      if (expectOkResult(createBarResult)) {
        const { id: barId } = createBarResult.value;

        const updateResult = await client.updateEntity({
          id: fooId,
          fields: { bar: { id: barId } },
        });
        expectResultValue(updateResult, {
          id: fooId,
          info: {
            type: 'EntityAdminFoo',
            name: createFooResult.value.info.name,
            version: 1,
            publishingState: EntityPublishState.Draft,
          },
          fields: {
            title: 'First title',
            summary: 'First summary',
            bar: { id: barId },
          },
        });

        const publishResult = await client.publishEntities([
          { id: fooId, version: 1 },
          { id: barId, version: 0 },
        ]);
        expectResultValue(publishResult, [
          { id: fooId, publishState: EntityPublishState.Published },
          { id: barId, publishState: EntityPublishState.Published },
        ]);

        const version0Result = await client.getEntity({ id: fooId, version: 0 });
        expectResultValue(version0Result, {
          id: fooId,
          info: {
            type: 'EntityAdminFoo',
            name: createFooResult.value.info.name,
            version: 0,
            publishingState: EntityPublishState.Published,
          },
          fields: { ...emptyFooFields, title: 'First title', summary: 'First summary' },
        });

        const version1Result = await client.getEntity({ id: fooId, version: 1 });
        expectResultValue(version1Result, {
          id: fooId,
          info: {
            type: 'EntityAdminFoo',
            name: createFooResult.value.info.name,
            version: 1,
            publishingState: EntityPublishState.Published,
          },
          fields: {
            title: 'First title',
            summary: 'First summary',
            bar: { id: barId },
          },
        });

        const publishedResult = await publishedClient.getEntity({ id: fooId });
        expectResultValue(publishedResult, {
          id: fooId,
          info: { type: 'EntityAdminFoo', name: createFooResult.value.info.name },
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
      const { id: bar1Id } = createBar1Result.value;
      const { id: bar2Id } = createBar2Result.value;

      const publishResult = await client.publishEntities([
        { id: bar1Id, version: 0 },
        { id: bar2Id, version: 0 },
      ]);
      expectResultValue(publishResult, [
        { id: bar1Id, publishState: EntityPublishState.Published },
        { id: bar2Id, publishState: EntityPublishState.Published },
      ]);

      const createBazResult = await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'First name' },
        fields: {
          title: 'First title',
          bar: { id: bar1Id },
          bars: [{ id: bar1Id }, { id: bar2Id }],
        },
      });
      if (expectOkResult(createBazResult)) {
        const { id: bazId } = createBazResult.value;

        const updateResult = await client.updateEntity({
          id: bazId,
          fields: { title: 'Updated title' },
        });
        expectResultValue(updateResult, {
          id: bazId,
          info: {
            type: 'EntityAdminBaz',
            name: createBazResult.value.info.name,
            version: 1,
            publishingState: EntityPublishState.Draft,
          },
          fields: {
            ...emptyBazFields,
            title: 'Updated title',
            bar: { id: bar1Id },
            bars: [{ id: bar1Id }, { id: bar2Id }],
          },
        });

        const publishResult = await client.publishEntities([{ id: bazId, version: 1 }]);
        expectResultValue(publishResult, [
          { id: bazId, publishState: EntityPublishState.Published },
        ]);

        const version0Result = await client.getEntity({ id: bazId, version: 0 });
        expectResultValue(version0Result, {
          id: bazId,
          info: {
            type: 'EntityAdminBaz',
            name: createBazResult.value.info.name,
            version: 0,
            publishingState: EntityPublishState.Published,
          },
          fields: {
            ...emptyBazFields,
            title: 'First title',
            bar: { id: bar1Id },
            bars: [{ id: bar1Id }, { id: bar2Id }],
          },
        });

        const version1Result = await client.getEntity({ id: bazId, version: 1 });
        expectResultValue(version1Result, {
          id: bazId,
          info: {
            type: 'EntityAdminBaz',
            name: createBazResult.value.info.name,
            version: 1,
            publishingState: EntityPublishState.Published,
          },
          fields: {
            ...emptyBazFields,
            title: 'Updated title',
            bar: { id: bar1Id },
            bars: [{ id: bar1Id }, { id: bar2Id }],
          },
        });

        const publishedResult = await publishedClient.getEntity({ id: bazId });
        expectResultValue(publishedResult, {
          id: bazId,
          info: { type: 'EntityAdminBaz', name: createBazResult.value.info.name },
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
        id,
        info: { name },
      } = createResult.value;

      const archiveResult = await client.archiveEntity({ id });
      expectResultValue(archiveResult, { id, publishState: EntityPublishState.Archived });

      const updateResult = await client.updateEntity({ id, fields: { title: 'Updated title' } });

      expectResultValue(updateResult, {
        id,
        info: {
          type: 'EntityAdminFoo',
          name,
          version: 1,
          publishingState: EntityPublishState.Archived,
        },
        fields: { ...emptyFooFields, title: 'Updated title' },
      });
    }
  });

  test('Update with the same field does not create new version', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminFoo', name: 'Foo' },
      fields: { title: 'Foo title' },
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;
      const updateResult = await client.updateEntity({ id, fields: { title: 'Foo title' } });
      if (expectOkResult(updateResult)) {
        const {
          info: { version },
        } = updateResult.value;
        expect(version).toBe(0); // no update
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
      const { id } = createResult.value;
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
      const { id } = createResult.value;
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
      const { id } = createResult.value;
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
      const { id } = createResult.value;
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
          info: { name },
        },
      } = upsertResult.value;
      expect(upsertResult.value).toEqual({
        effect: 'created',
        entity: {
          id,
          info: {
            name,
            publishingState: EntityPublishState.Draft,
            type: 'EntityAdminBaz',
            version: 0,
          },
          fields: {
            ...emptyBazFields,
          },
        },
      });

      const getResult = await client.getEntity({ id });
      if (expectOkResult(getResult)) {
        expect(getResult.value).toEqual(upsertResult.value.entity);
      }
    }
  });

  test('Update existing entity', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Original Baz' },
      fields: { title: 'Original title' },
    });

    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      const upsertResult = await client.upsertEntity({
        id,
        info: { type: 'EntityAdminBaz', name: 'Updated Baz' },
        fields: { title: 'Updated title' },
      });
      if (expectOkResult(upsertResult)) {
        const {
          entity: {
            info: { name },
          },
        } = upsertResult.value;

        expect(name).toMatch(/^Updated Baz/);
        expect(upsertResult.value).toEqual({
          effect: 'updated',
          entity: {
            id,
            info: {
              name,
              publishingState: EntityPublishState.Draft,
              type: 'EntityAdminBaz',
              version: 1,
            },
            fields: {
              ...emptyBazFields,
              title: 'Updated title',
            },
          },
        });

        const getResult = await client.getEntity({ id });
        if (expectOkResult(getResult)) {
          expect(getResult.value).toEqual(upsertResult.value.entity);
        }
      }
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
      const { id: baz1Id } = createBaz1Result.value;

      const createBaz2Result = await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'Baz 2' },
        fields: {
          title: 'Baz title 2',
          baz: { id: baz1Id },
        },
      });
      if (expectOkResult(createBaz2Result)) {
        const { id: baz2Id } = createBaz2Result.value;

        expectOkResult(await client.updateEntity({ id: baz1Id, fields: { baz: { id: baz2Id } } }));

        const publishResult = await client.publishEntities([
          { id: baz1Id, version: 1 },
          { id: baz2Id, version: 0 },
        ]);
        expectResultValue(publishResult, [
          { id: baz1Id, publishState: EntityPublishState.Published },
          { id: baz2Id, publishState: EntityPublishState.Published },
        ]);
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
        id,
        info: { name, version },
      } = createBaz1Result.value;

      const archiveResult = await client.archiveEntity({ id });
      expectResultValue(archiveResult, { id, publishState: EntityPublishState.Archived });

      const publishResult = await client.publishEntities([{ id, version }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          publishingState: EntityPublishState.Published,
        },
        fields: { ...emptyBazFields, title: 'Baz title 1' },
      });
    }
  });

  test('Error: Publish published version', async () => {
    const createBazResult = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz 1' },
      fields: { title: 'Baz title 1' },
    });
    if (expectOkResult(createBazResult)) {
      const { id: bazId } = createBazResult.value;

      const firstPublishResult = await client.publishEntities([{ id: bazId, version: 0 }]);
      expectResultValue(firstPublishResult, [
        { id: bazId, publishState: EntityPublishState.Published },
      ]);

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
      const barId = createBarResult.value.id;

      const createFooResult = await client.createEntity({
        info: { type: 'EntityAdminFoo', name: 'Foo name' },
        fields: {
          title: 'Foo title',
          bar: { id: barId },
        },
      });
      if (expectOkResult(createFooResult)) {
        const { id: fooId } = createFooResult.value;

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
      const { id: fooId } = createFooResult.value;
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
        id,
        info: { name, version },
      } = createResult.value;

      const publishResult = await client.publishEntities([{ id, version }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

      const unpublishResult = await client.unpublishEntities([{ id }]);
      expectResultValue(unpublishResult, [{ id, publishState: EntityPublishState.Withdrawn }]);

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, {
        id,
        info: {
          type: 'EntityAdminBaz',
          name,
          version: 0,
          publishingState: EntityPublishState.Withdrawn,
        },
        fields: { ...emptyBazFields, title: 'Baz title 1' },
      });
    }
  });

  test('Two published entities referencing each other', async () => {
    const createBaz1Result = await client.createEntity({
      info: { type: 'EntityAdminBaz', name: 'Baz 1' },
      fields: { title: 'Baz title 1' },
    });
    if (expectOkResult(createBaz1Result)) {
      const { id: baz1Id } = createBaz1Result.value;

      const createBaz2Result = await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'Baz 2' },
        fields: { title: 'Baz title 2', baz: { id: baz1Id } },
      });
      if (expectOkResult(createBaz2Result)) {
        const { id: baz2Id } = createBaz2Result.value;

        expectOkResult(await client.updateEntity({ id: baz1Id, fields: { baz: { id: baz2Id } } }));

        const publishResult = await client.publishEntities([
          { id: baz1Id, version: 1 },
          { id: baz2Id, version: 0 },
        ]);
        expectResultValue(publishResult, [
          { id: baz1Id, publishState: EntityPublishState.Published },
          { id: baz2Id, publishState: EntityPublishState.Published },
        ]);

        const unpublishResult = await client.unpublishEntities([{ id: baz1Id }, { id: baz2Id }]);
        expectResultValue(unpublishResult, [
          { id: baz1Id, publishState: EntityPublishState.Withdrawn },
          { id: baz2Id, publishState: EntityPublishState.Withdrawn },
        ]);
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
      const { id: baz1Id } = createBaz1Result.value;

      const createBaz2Result = await client.createEntity({
        info: { type: 'EntityAdminBaz', name: 'Baz 2' },
        fields: {
          title: 'Baz title 2',
          baz: { id: baz1Id },
        },
      });
      if (expectOkResult(createBaz2Result)) {
        const publishResult = await client.publishEntities([{ id: baz1Id, version: 0 }]);
        expectResultValue(publishResult, [
          { id: baz1Id, publishState: EntityPublishState.Published },
        ]);

        const unpublishResult = await client.unpublishEntities([{ id: baz1Id }]);
        expectResultValue(unpublishResult, [
          { id: baz1Id, publishState: EntityPublishState.Withdrawn },
        ]);
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
      const { id: barId } = createBarResult.value;

      const createFooResult = await client.createEntity({
        info: { type: 'EntityAdminFoo', name: 'Foo name' },
        fields: {
          title: 'Foo title',
          bar: { id: barId },
        },
      });
      if (expectOkResult(createFooResult)) {
        const { id: fooId } = createFooResult.value;

        const publishResult = await client.publishEntities([
          { id: fooId, version: 0 },
          { id: barId, version: 0 },
        ]);
        expectResultValue(publishResult, [
          { id: fooId, publishState: EntityPublishState.Published },
          { id: barId, publishState: EntityPublishState.Published },
        ]);

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
      const { id: barId } = createBarResult.value;

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
      const { id } = createResult.value;

      const archiveResult = await client.archiveEntity({ id });
      expectResultValue(archiveResult, { id, publishState: EntityPublishState.Archived });

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
        id,
        info: { name },
      } = createResult.value;

      const archiveResult = await client.archiveEntity({ id });
      expectResultValue(archiveResult, { id, publishState: EntityPublishState.Archived });

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
      expectResultValue(getResult, {
        id,
        info: {
          name,
          type: 'EntityAdminBar',
          version: 0,
          publishingState: EntityPublishState.Archived,
        },
        fields: { title: 'Bar title' },
      });
    }
  });

  test('Archive archived entity', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      const archiveResult1 = await client.archiveEntity({ id });
      expectResultValue(archiveResult1, { id, publishState: EntityPublishState.Archived });

      const archiveResult2 = await client.archiveEntity({ id });
      expectResultValue(archiveResult2, { id, publishState: EntityPublishState.Archived });

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
        id,
        info: { version },
      } = createResult.value;

      const publishResult = await client.publishEntities([{ id, version }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

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
      const { id } = createResult.value;

      const unarchiveResult = await client.unarchiveEntity({ id });
      expectResultValue(unarchiveResult, { id, publishState: EntityPublishState.Draft });

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
        id,
        info: { name },
      } = createResult.value;

      const archiveResult = await client.archiveEntity({ id });
      expectResultValue(archiveResult, { id, publishState: EntityPublishState.Archived });

      const unarchiveResult = await client.unarchiveEntity({ id });
      expectResultValue(unarchiveResult, { id, publishState: EntityPublishState.Draft });

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
      expectResultValue(getResult, {
        id,
        info: {
          name,
          type: 'EntityAdminBar',
          version: 0,
          publishingState: EntityPublishState.Draft,
        },
        fields: { title: 'Bar title' },
      });
    }
  });

  test('Unarchive once published, then archived entity', async () => {
    const createResult = await client.createEntity({
      info: { type: 'EntityAdminBar', name: 'Bar name' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createResult)) {
      const {
        id,
        info: { version },
      } = createResult.value;

      const publishResult = await client.publishEntities([{ id, version }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

      const unpublishResult = await client.unpublishEntities([{ id }]);
      expectResultValue(unpublishResult, [{ id, publishState: EntityPublishState.Withdrawn }]);

      const archiveResult = await client.archiveEntity({ id });
      expectResultValue(archiveResult, { id, publishState: EntityPublishState.Archived });

      const unarchiveResult = await client.unarchiveEntity({ id });
      expectResultValue(unarchiveResult, { id, publishState: EntityPublishState.Withdrawn });
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
      const { id } = createResult.value;
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
      const { id } = createResult.value;

      const publishResult = await client.publishEntities([{ id, version: 0 }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

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
      const { id } = createResult.value;

      const publishResult = await client.publishEntities([{ id, version: 0 }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

      const unpublishResult = await client.unpublishEntities([{ id }]);
      expectResultValue(unpublishResult, [{ id, publishState: EntityPublishState.Withdrawn }]);

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
