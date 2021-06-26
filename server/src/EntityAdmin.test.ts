import {
  CoreTestUtils,
  EntityPublishState,
  ErrorType,
  FieldType,
  PublishingEventKind,
  RichTextBlockType,
} from '@datadata/core';
import type {
  AdminClient,
  AdminEntity,
  AdminQuery,
  BoundingBox,
  Connection,
  Edge,
  Paging,
} from '@datadata/core';
import { validate as validateUuid, v4 as uuidv4 } from 'uuid';
import type { Server, SessionContext } from '.';
import { EntityAdmin, isPagingForwards, PublishedEntity } from '.';
import { createTestServer, ensureSessionContext, updateSchema } from './ServerTestUtils';
import {
  expectEntityHistoryVersions,
  expectResultValue,
  expectSearchResultEntities,
} from '../test/AdditionalTestUtils';
import { createServerClient } from './Client';

const { expectErrorResult, expectOkResult } = CoreTestUtils;

let server: Server;
let context: SessionContext;
let client: AdminClient;
let entitiesOfTypeAdminOnlyEditBefore: AdminEntity[];

const emptyFooFields = { bar: null, summary: null, title: null };
const emptyBazFields = {
  bar: null,
  bars: null,
  baz: null,
  body: null,
  bodyList: null,
  bodyOnlyParagraph: null,
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
  client = createServerClient({
    resolveContext: () => ensureSessionContext(server, 'test', 'entity-admin'),
  });
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

  await ensureEntitiesExistForAdminOnlyEditBefore(context);
  const knownIds = await getEntitiesForAdminOnlyEditBefore(context);
  entitiesOfTypeAdminOnlyEditBefore = knownIds.entities;
});
afterAll(async () => {
  await server.shutdown();
});

async function ensureEntitiesExistForAdminOnlyEditBefore(context: SessionContext) {
  const requestedCount = 50;
  const entitiesOfTypeCount = await client.getTotalCount({
    entityTypes: ['AdminOnlyEditBefore'],
  });

  if (expectOkResult(entitiesOfTypeCount)) {
    for (let count = entitiesOfTypeCount.value; count < requestedCount; count += 1) {
      const random = String(Math.random()).slice(2);
      const createResult = await client.createEntity({
        _type: 'AdminOnlyEditBefore',
        _name: random,
        message: `Hey ${random}`,
      });
      if (expectOkResult(createResult)) {
        const publishResult = await EntityAdmin.publishEntities(context, [
          { id: createResult.value.id, version: createResult.value._version },
        ]);
        publishResult.throwIfError();
      }
    }
  }
}

async function getEntitiesForAdminOnlyEditBefore(context: SessionContext) {
  const entities: AdminEntity[] = [];
  await visitAllEntityPages(
    context,
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
  context: SessionContext,
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

  await visitAllEntityPages(context, query, { first: 50 }, (connection) => {
    for (const edge of connection.edges) {
      if (edge.node.isOk() && edge.node.value.id === entityId) {
        matchCount += 1;
      }
    }
  });

  return matchCount;
}

async function createBarWithFooBazReferences(
  context: SessionContext,
  fooCount: number,
  bazCount: number,
  bazReferencesPerEntity = 1
) {
  const createBarResult = await client.createEntity({
    _type: 'EntityAdminBar',
    _name: 'Bar',
    title: 'Bar',
  });
  if (createBarResult.isError()) {
    throw createBarResult.toError();
  }

  const { id: barId } = createBarResult.value;

  const fooEntities: AdminEntity[] = [];
  const bazEntities: AdminEntity[] = [];

  for (let i = 0; i < fooCount; i += 1) {
    const createFooResult = await client.createEntity({
      _type: 'EntityAdminFoo',
      _name: 'Foo: ' + i,
      bar: { id: barId },
    });
    if (expectOkResult(createFooResult)) {
      fooEntities.push(createFooResult.value);
    }
  }
  for (let i = 0; i < bazCount; i += 1) {
    const bars = [...new Array(bazReferencesPerEntity - 1)].map(() => ({ id: barId }));
    const createBazResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz: ' + i,
      bar: { id: barId },
      bars,
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
      _type: 'EntityAdminFoo',
      _name: 'Foo',
      title: 'Title',
    });

    if (expectOkResult(createResult)) {
      const { id } = createResult.value;
      const updateResult = await EntityAdmin.updateEntity(context, { id, title: 'Updated title' });
      expectOkResult(updateResult);

      const versionMaxResult = await client.getEntity({ id });
      expectResultValue(versionMaxResult, {
        id,
        _type: 'EntityAdminFoo',
        _name: createResult.value._name,
        _version: 1,
        _publishState: EntityPublishState.Draft,
        ...emptyFooFields,
        title: 'Updated title',
      });
    }
  });

  test('Error: Get entity with invalid id', async () => {
    const result = await client.getEntity({ id: '13e4c7da-616e-44a3-a039-24f96f9b17da' });
    expectErrorResult(result, ErrorType.NotFound, 'No such entity');
  });

  test('Error: Get entity with invalid version', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminFoo',
      _name: 'Foo',
      title: 'Title',
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
    expect(result).toHaveLength(0);
  });

  test('Get 2 entities', async () => {
    const createFoo1Result = await client.createEntity({
      _type: 'EntityAdminFoo',
      _name: 'Foo',
      title: 'Title 1',
    });
    const createFoo2Result = await client.createEntity({
      _type: 'EntityAdminFoo',
      _name: 'Foo',
      title: 'Title 2',
    });

    if (expectOkResult(createFoo1Result) && expectOkResult(createFoo2Result)) {
      const { id: foo1Id, _name: foo1Name } = createFoo1Result.value;
      const { id: foo2Id, _name: foo2Name } = createFoo2Result.value;

      const result = await client.getEntities([{ id: foo2Id }, { id: foo1Id }]);
      expect(result).toHaveLength(2);
      expectResultValue(result[0], {
        _type: 'EntityAdminFoo',
        id: foo2Id,
        _name: foo2Name,
        _version: 0,
        _publishState: EntityPublishState.Draft,
        ...emptyFooFields,
        title: 'Title 2',
      });
      expectResultValue(result[1], {
        _type: 'EntityAdminFoo',
        id: foo1Id,
        _name: foo1Name,
        _version: 0,
        _publishState: EntityPublishState.Draft,
        ...emptyFooFields,
        title: 'Title 1',
      });
    }
  });

  test('Gets the last version', async () => {
    const createFooResult = await client.createEntity({
      _type: 'EntityAdminFoo',
      _name: 'Foo',
      title: 'First title',
    });

    if (expectOkResult(createFooResult)) {
      const { id: fooId, _name: fooName } = createFooResult.value;

      expectOkResult(
        await EntityAdmin.updateEntity(context, { id: fooId, title: 'Updated title' })
      );

      const result = await client.getEntities([{ id: fooId }]);
      expect(result).toHaveLength(1);
      expectResultValue(result[0], {
        _type: 'EntityAdminFoo',
        id: fooId,
        _name: fooName,
        _version: 1,
        _publishState: EntityPublishState.Draft,
        ...emptyFooFields,
        title: 'Updated title',
      });
    }
  });

  test('Error: Get entities with invalid ids', async () => {
    const result = await client.getEntities([
      { id: '13e4c7da-616e-44a3-a039-24f96f9b17da' },
      { id: '13e4c7da-616e-44a3-44a3-24f96f9b17da' },
    ]);
    expect(result).toHaveLength(2);
    expectErrorResult(result[0], ErrorType.NotFound, 'No such entity');
    expectErrorResult(result[1], ErrorType.NotFound, 'No such entity');
  });
});

describe('createEntity()', () => {
  test('Create EntityAdminFoo and publish', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminFoo',
      _name: 'Foo',
      title: 'Title',
    });
    if (expectOkResult(createResult)) {
      const { id, _name: name } = createResult.value;
      expect(validateUuid(id)).toBeTruthy();
      expect(name).toMatch(/^Foo(#[0-9]+)?$/);

      expectResultValue(createResult, {
        id,
        _type: 'EntityAdminFoo',
        _name: name,
        _version: 0,
        _publishState: EntityPublishState.Draft,
        ...emptyFooFields,
        title: 'Title',
      });

      const publishResult = await EntityAdmin.publishEntities(context, [{ id, version: 0 }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

      const historyResult = await EntityAdmin.getEntityHistory(context, id);
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
        _type: 'EntityAdminFoo',
        _name: name,
        _version: 0,
        _publishState: EntityPublishState.Published,
        ...emptyFooFields,
        title: 'Title',
      });

      const publishedResult = await PublishedEntity.getEntity(context, id);
      expectResultValue(publishedResult, {
        id,
        _type: 'EntityAdminFoo',
        _name: name,
        ...emptyFooFields,
        title: 'Title',
      });
    }
  });

  test('Create EntityAdminFoo w/o publish', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminFoo',
      _name: 'Draft',
      title: 'Draft',
    });
    if (expectOkResult(createResult)) {
      expect(validateUuid(createResult.value.id)).toBeTruthy();
      const { id } = createResult.value;

      expectResultValue(createResult, {
        id,
        _type: 'EntityAdminFoo',
        _name: createResult.value._name,
        _version: 0,
        _publishState: EntityPublishState.Draft,
        ...emptyFooFields,
        title: 'Draft',
      });

      const historyResult = await EntityAdmin.getEntityHistory(context, id);
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
        _type: 'EntityAdminFoo',
        _name: createResult.value._name,
        _version: 0,
        _publishState: EntityPublishState.Draft,
        ...emptyFooFields,
        title: 'Draft',
      });

      const publishedResult = await PublishedEntity.getEntity(context, id);
      expectErrorResult(publishedResult, ErrorType.NotFound, 'No such entity');
    }
  });

  test('Create EntityAdminFoo with id', async () => {
    const id = uuidv4();
    const createResult = await client.createEntity({
      id,
      _type: 'EntityAdminFoo',
      _name: 'Draft',
      title: 'Draft',
    });
    if (expectOkResult(createResult)) {
      const { _name: name } = createResult.value;
      expectResultValue(createResult, {
        id,
        _type: 'EntityAdminFoo',
        _name: name,
        _version: 0,
        _publishState: EntityPublishState.Draft,
        ...emptyFooFields,
        title: 'Draft',
      });
    }
  });

  test('Create EntityAdminFoo with reference to Bar', async () => {
    const createBarResult = await client.createEntity({
      _type: 'EntityAdminBar',
      _name: 'Bar name',
      title: 'Bar title',
    });
    if (expectOkResult(createBarResult)) {
      const barId = createBarResult.value.id;

      const createFooResult = await client.createEntity({
        _type: 'EntityAdminFoo',
        _name: 'Foo name',
        title: 'Foo title',
        bar: { id: barId },
      });
      if (expectOkResult(createFooResult)) {
        expect(validateUuid(createFooResult.value.id)).toBeTruthy();
        const fooId = createFooResult.value.id;

        expectResultValue(createFooResult, {
          id: fooId,
          _type: 'EntityAdminFoo',
          _name: createFooResult.value._name,
          _version: 0,
          _publishState: EntityPublishState.Draft,
          ...emptyFooFields,
          title: 'Foo title',
          bar: { id: barId },
        });

        const publishResult = await EntityAdmin.publishEntities(context, [
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
          _type: 'EntityAdminFoo',
          _name: createFooResult.value._name,
          _version: 0,
          _publishState: EntityPublishState.Published,
          ...emptyFooFields,
          title: 'Foo title',
          bar: { id: barId },
        });

        const publishedFooResult = await PublishedEntity.getEntity(context, fooId);
        expectResultValue(publishedFooResult, {
          id: fooId,
          _type: 'EntityAdminFoo',
          _name: createFooResult.value._name,
          ...emptyFooFields,
          title: 'Foo title',
          bar: { id: barId },
        });
      }
    }
  });

  test('Create EntityAdminBaz with string list', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      tags: ['one', 'two', 'three'],
    });
    if (expectOkResult(createResult)) {
      const { id, _name: name } = createResult.value;
      expectResultValue(createResult, {
        id,
        _type: 'EntityAdminBaz',
        _name: name,
        _version: 0,
        _publishState: EntityPublishState.Draft,
        ...emptyBazFields,
        tags: ['one', 'two', 'three'],
      });

      const getResult = await client.getEntity({ id });
      if (expectOkResult(getResult)) {
        expectResultValue(getResult, {
          id,
          _type: 'EntityAdminBaz',
          _name: name,
          _version: 0,
          _publishState: EntityPublishState.Draft,
          ...emptyBazFields,
          tags: ['one', 'two', 'three'],
        });
      }
    }
  });

  test('Create EntityAdminBaz with rich text and rich text list', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      body: { blocks: [{ type: 'paragraph', data: { text: 'Hello world' } }] },
      bodyList: [
        { blocks: [{ type: 'paragraph', data: { text: 'First rich text' } }] },
        { blocks: [{ type: 'paragraph', data: { text: 'Second rich text' } }] },
      ],
    });
    if (expectOkResult(createResult)) {
      const { id, _name: name } = createResult.value;
      expectResultValue(createResult, {
        id,
        _type: 'EntityAdminBaz',
        _name: name,
        _version: 0,
        _publishState: EntityPublishState.Draft,
        ...emptyBazFields,
        body: { blocks: [{ type: 'paragraph', data: { text: 'Hello world' } }] },
        bodyList: [
          { blocks: [{ type: 'paragraph', data: { text: 'First rich text' } }] },
          { blocks: [{ type: 'paragraph', data: { text: 'Second rich text' } }] },
        ],
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, {
        id,
        _type: 'EntityAdminBaz',
        _name: name,
        _version: 0,
        _publishState: EntityPublishState.Draft,
        ...emptyBazFields,
        body: { blocks: [{ type: 'paragraph', data: { text: 'Hello world' } }] },
        bodyList: [
          { blocks: [{ type: 'paragraph', data: { text: 'First rich text' } }] },
          { blocks: [{ type: 'paragraph', data: { text: 'Second rich text' } }] },
        ],
      });
    }
  });

  test('Create EntityAdminBaz with rich text with value item and entity references', async () => {
    const createBar1Result = await client.createEntity({
      _type: 'EntityAdminBar',
      _name: 'Bar 1',
    });
    const createBar2Result = await client.createEntity({
      _type: 'EntityAdminBar',
      _name: 'Bar 2',
    });
    if (expectOkResult(createBar1Result) && expectOkResult(createBar2Result)) {
      const { id: bar1Id } = createBar1Result.value;
      const { id: bar2Id } = createBar2Result.value;

      const createBazResult = await client.createEntity({
        _type: 'EntityAdminBaz',
        _name: 'Baz',
        body: {
          blocks: [
            { type: RichTextBlockType.entity, data: { id: bar1Id } },
            { type: RichTextBlockType.entity, data: null },
            {
              type: RichTextBlockType.valueItem,
              data: {
                _type: 'EntityAdminStringReference',
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
      });
      if (expectOkResult(createBazResult)) {
        const baz = createBazResult.value;
        const { id: bazId, _name: bazName } = createBazResult.value;
        expectResultValue(createBazResult, {
          id: bazId,
          _type: 'EntityAdminBaz',
          _name: bazName,
          _version: 0,
          _publishState: EntityPublishState.Draft,
          ...emptyBazFields,
          body: {
            blocks: [
              { type: RichTextBlockType.entity, data: { id: bar1Id } },
              { type: RichTextBlockType.entity, data: null },
              {
                type: RichTextBlockType.valueItem,
                data: {
                  _type: 'EntityAdminStringReference',
                  string: 'Hello bar 2',
                  reference: { id: bar2Id },
                },
              },
              { type: RichTextBlockType.valueItem, data: null },
            ],
          },
        });

        const getResult = await client.getEntity({ id: bazId });
        expectResultValue(getResult, {
          id: bazId,
          _type: 'EntityAdminBaz',
          _name: bazName,
          _version: 0,
          _publishState: EntityPublishState.Draft,
          ...emptyBazFields,
          body: {
            blocks: [
              { type: RichTextBlockType.entity, data: { id: bar1Id } },
              { type: RichTextBlockType.entity, data: null },
              {
                type: RichTextBlockType.valueItem,
                data: {
                  _type: 'EntityAdminStringReference',
                  string: 'Hello bar 2',
                  reference: { id: bar2Id },
                },
              },
              { type: RichTextBlockType.valueItem, data: null },
            ],
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
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      location: { lat: 55.60498, lng: 13.003822 },
      locations: [
        { lat: 55.60498, lng: 13.003822 },
        { lat: 56.381561, lng: 13.99286 },
      ],
    });
    if (expectOkResult(createResult)) {
      const { id, _name: name } = createResult.value;
      expectResultValue(createResult, {
        id,
        _type: 'EntityAdminBaz',
        _name: name,
        _version: 0,
        _publishState: EntityPublishState.Draft,
        ...emptyBazFields,
        location: { lat: 55.60498, lng: 13.003822 },
        locations: [
          { lat: 55.60498, lng: 13.003822 },
          { lat: 56.381561, lng: 13.99286 },
        ],
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, {
        id,
        _type: 'EntityAdminBaz',
        _name: name,
        _version: 0,
        _publishState: EntityPublishState.Draft,
        ...emptyBazFields,
        location: { lat: 55.60498, lng: 13.003822 },
        locations: [
          { lat: 55.60498, lng: 13.003822 },
          { lat: 56.381561, lng: 13.99286 },
        ],
      });
    }
  });

  test('Create EntityAdminBaz with reference list', async () => {
    const createBar1Result = await client.createEntity({
      _type: 'EntityAdminBar',
      _name: 'Bar1',
    });
    const createBar2Result = await client.createEntity({
      _type: 'EntityAdminBar',
      _name: 'Bar2',
    });

    if (expectOkResult(createBar1Result) && expectOkResult(createBar2Result)) {
      const { id: bar1Id } = createBar1Result.value;
      const { id: bar2Id } = createBar2Result.value;

      const createBazResult = await client.createEntity({
        _type: 'EntityAdminBaz',
        _name: 'Baz',
        bars: [{ id: bar1Id }, { id: bar2Id }],
      });
      if (expectOkResult(createBazResult)) {
        const baz = createBazResult.value;
        const { id, _name: name } = createBazResult.value;
        expectResultValue(createBazResult, {
          id,
          _type: 'EntityAdminBaz',
          _name: name,
          _version: 0,
          _publishState: EntityPublishState.Draft,
          ...emptyBazFields,
          bars: [{ id: bar1Id }, { id: bar2Id }],
        });

        const getResult = await client.getEntity({ id });
        expectResultValue(getResult, {
          id,
          _type: 'EntityAdminBaz',
          _name: name,
          _version: 0,
          _publishState: EntityPublishState.Draft,
          ...emptyBazFields,
          bars: [{ id: bar1Id }, { id: bar2Id }],
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
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      twoStrings: { _type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' },
    });
    if (expectOkResult(createResult)) {
      const { id, _name: name } = createResult.value;
      expectResultValue(createResult, {
        id,
        _type: 'EntityAdminBaz',
        _name: name,
        _version: 0,
        _publishState: EntityPublishState.Draft,
        ...emptyBazFields,
        twoStrings: { _type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' },
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, {
        id,
        _type: 'EntityAdminBaz',
        _name: name,
        _version: 0,
        _publishState: EntityPublishState.Draft,
        ...emptyBazFields,
        twoStrings: { _type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' },
      });
    }
  });

  test('Create EntityAdminBaz with list of EntityAdminTwoStrings value type', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      twoStringsList: [
        { _type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' },
        { _type: 'EntityAdminTwoStrings', one: 'Three', two: 'Four' },
      ],
    });
    if (expectOkResult(createResult)) {
      const { id, _name: name } = createResult.value;
      expectResultValue(createResult, {
        id,
        _type: 'EntityAdminBaz',
        _name: name,
        _version: 0,
        _publishState: EntityPublishState.Draft,
        ...emptyBazFields,
        twoStringsList: [
          { _type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' },
          { _type: 'EntityAdminTwoStrings', one: 'Three', two: 'Four' },
        ],
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, {
        id,
        _type: 'EntityAdminBaz',
        _name: name,
        _version: 0,
        _publishState: EntityPublishState.Draft,
        ...emptyBazFields,
        twoStringsList: [
          { _type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' },
          { _type: 'EntityAdminTwoStrings', one: 'Three', two: 'Four' },
        ],
      });
    }
  });

  test('Create EntityAdminBaz with EntityAdminStringReference value type', async () => {
    const createBarResult = await client.createEntity({
      _type: 'EntityAdminBar',
      _name: 'Bar',
    });
    if (expectOkResult(createBarResult)) {
      const { id: barId } = createBarResult.value;

      const createBazResult = await client.createEntity({
        _type: 'EntityAdminBaz',
        _name: 'Baz',
        stringReference: {
          _type: 'EntityAdminStringReference',
          string: 'Hello string',
          reference: { id: barId },
        },
      });
      if (expectOkResult(createBazResult)) {
        const baz = createBazResult.value;
        const { id: bazId, _name: bazName } = createBazResult.value;
        expectResultValue(createBazResult, {
          id: bazId,
          _type: 'EntityAdminBaz',
          _name: bazName,
          _version: 0,
          _publishState: EntityPublishState.Draft,
          ...emptyBazFields,
          stringReference: {
            _type: 'EntityAdminStringReference',
            string: 'Hello string',
            reference: { id: barId },
          },
        });

        const getResult = await client.getEntity({ id: bazId });
        expectResultValue(getResult, {
          id: bazId,
          _type: 'EntityAdminBaz',
          _name: bazName,
          _version: 0,
          _publishState: EntityPublishState.Draft,
          ...emptyBazFields,
          stringReference: {
            _type: 'EntityAdminStringReference',
            string: 'Hello string',
            reference: { id: barId },
          },
        });

        const barReferences = await client.searchEntities({ referencing: barId });
        expectSearchResultEntities(barReferences, [baz]);
      }
    }
  });

  test('Create EntityAdminBaz with EntityAdminListFields value type', async () => {
    const createBar1Result = await client.createEntity({
      _type: 'EntityAdminBar',
      _name: 'Bar 1',
    });
    const createBar2Result = await client.createEntity({
      _type: 'EntityAdminBar',
      _name: 'Bar 2',
    });
    if (expectOkResult(createBar1Result) && expectOkResult(createBar2Result)) {
      const { id: bar1Id } = createBar1Result.value;
      const { id: bar2Id } = createBar2Result.value;

      const createBazResult = await client.createEntity({
        _type: 'EntityAdminBaz',
        _name: 'Baz',
        listFields: {
          _type: 'EntityAdminListFields',
          stringList: ['one', 'two', 'three'],
          referenceList: [{ id: bar1Id }, { id: bar2Id }],
        },
        listFieldsList: [
          {
            _type: 'EntityAdminListFields',
            stringList: ['three', 'two', 'one'],
            referenceList: [{ id: bar2Id }, { id: bar1Id }],
          },
          {
            _type: 'EntityAdminListFields',
            stringList: ['one', 'two', 'three'],
            referenceList: [{ id: bar1Id }, { id: bar2Id }],
          },
        ],
      });
      if (expectOkResult(createBazResult)) {
        const { id: bazId, _name: bazName } = createBazResult.value;
        expectResultValue(createBazResult, {
          id: bazId,
          _type: 'EntityAdminBaz',
          _name: bazName,
          _version: 0,
          _publishState: EntityPublishState.Draft,
          ...emptyBazFields,
          listFields: {
            _type: 'EntityAdminListFields',
            stringList: ['one', 'two', 'three'],
            referenceList: [{ id: bar1Id }, { id: bar2Id }],
          },
          listFieldsList: [
            {
              _type: 'EntityAdminListFields',
              stringList: ['three', 'two', 'one'],
              referenceList: [{ id: bar2Id }, { id: bar1Id }],
            },
            {
              _type: 'EntityAdminListFields',
              stringList: ['one', 'two', 'three'],
              referenceList: [{ id: bar1Id }, { id: bar2Id }],
            },
          ],
        });

        const getResult = await client.getEntity({ id: bazId });
        expectResultValue(getResult, {
          id: bazId,
          _type: 'EntityAdminBaz',
          _name: bazName,
          _version: 0,
          _publishState: EntityPublishState.Draft,
          ...emptyBazFields,
          listFields: {
            _type: 'EntityAdminListFields',
            stringList: ['one', 'two', 'three'],
            referenceList: [{ id: bar1Id }, { id: bar2Id }],
          },
          listFieldsList: [
            {
              _type: 'EntityAdminListFields',
              stringList: ['three', 'two', 'one'],
              referenceList: [{ id: bar2Id }, { id: bar1Id }],
            },
            {
              _type: 'EntityAdminListFields',
              stringList: ['one', 'two', 'three'],
              referenceList: [{ id: bar1Id }, { id: bar2Id }],
            },
          ],
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
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      nested: {
        _type: 'EntityAdminNested',
        title: 'Nested 0',
        child: {
          _type: 'EntityAdminNested',
          title: 'Nested 0.a',
          child: {
            _type: 'EntityAdminNested',
            title: 'Nested 0.a.I',
          },
        },
      },
    });
    if (expectOkResult(createResult)) {
      const { id: bazId, _name: bazName } = createResult.value;
      expectResultValue(createResult, {
        id: bazId,
        _type: 'EntityAdminBaz',
        _name: bazName,
        _version: 0,
        _publishState: EntityPublishState.Draft,
        ...emptyBazFields,
        nested: {
          _type: 'EntityAdminNested',
          title: 'Nested 0',
          child: {
            _type: 'EntityAdminNested',
            title: 'Nested 0.a',
            child: {
              _type: 'EntityAdminNested',
              title: 'Nested 0.a.I',
            },
          },
        },
      });

      const getResult = await client.getEntity({ id: bazId });
      expectResultValue(getResult, {
        id: bazId,
        _type: 'EntityAdminBaz',
        _name: bazName,
        _version: 0,
        _publishState: EntityPublishState.Draft,
        ...emptyBazFields,
        nested: {
          _type: 'EntityAdminNested',
          title: 'Nested 0',
          child: {
            _type: 'EntityAdminNested',
            title: 'Nested 0.a',
            child: {
              _type: 'EntityAdminNested',
              title: 'Nested 0.a.I',
            },
          },
        },
      });
    }
  });

  test('Error: Create with invalid type', async () => {
    const result = await client.createEntity({
      _type: 'Invalid',
      _name: 'name',
      foo: 'title',
    });

    expectErrorResult(result, ErrorType.BadRequest, 'Entity type Invalid doesn’t exist');
  });

  test('Error: Create without _type', async () => {
    const result = await client.createEntity({
      _type: '',
      _name: 'Foo',
      foo: 'title',
    });

    expectErrorResult(result, ErrorType.BadRequest, 'Missing entity._type');
  });

  test('Error: Create without _name', async () => {
    const result = await client.createEntity({
      _type: 'EntityAdminFoo',
      _name: '',
      title: 'title',
    });

    expectErrorResult(result, ErrorType.BadRequest, 'Missing entity._name');
  });

  test('Error: Create with invalid _version', async () => {
    const result = await client.createEntity({
      _type: 'EntityAdminFoo',
      _name: 'Foo',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      _version: 1 as any,
    });

    expectErrorResult(result, ErrorType.BadRequest, 'Unsupported version for create: 1');
  });

  test('Error: Create with invalid field', async () => {
    const result = await client.createEntity({
      _type: 'EntityAdminFoo',
      _name: 'Foo',
      invalid: 'hello',
    });

    expectErrorResult(result, ErrorType.BadRequest, 'Unsupported field names: invalid');
  });

  test('Error: Create EntityAdminFoo with reference to missing entity', async () => {
    const result = await client.createEntity({
      _type: 'EntityAdminFoo',
      _name: 'Foo name',
      title: 'Foo title',
      bar: { id: 'fcc46a9e-2097-4bd6-bb08-56d5f59db26b' },
    });
    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'entity.bar: referenced entity (fcc46a9e-2097-4bd6-bb08-56d5f59db26b) doesn’t exist'
    );
  });

  test('Error: Create EntityAdminFoo with reference to wrong entity type', async () => {
    const referenceId = entitiesOfTypeAdminOnlyEditBefore[0].id;
    const result = await client.createEntity({
      _type: 'EntityAdminFoo',
      _name: 'Foo name',
      title: 'Foo title',
      bar: { id: referenceId },
    });
    expectErrorResult(
      result,
      ErrorType.BadRequest,
      `entity.bar: referenced entity (${referenceId}) has an invalid type AdminOnlyEditBefore`
    );
  });

  test('Error: Set string when expecting list of string', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      tags: 'invalid',
    });
    expectErrorResult(createResult, ErrorType.BadRequest, 'entity.tags: expected list');
  });

  test('Error: Set list of string when expecting string', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      title: ['invalid', 'foo'],
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.title: expected string, got list'
    );
  });

  test('Error: Set reference when expecting list of references', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      bars: { id: 'fcc46a9e-2097-4bd6-bb08-56d5f59db26b' },
    });
    expectErrorResult(createResult, ErrorType.BadRequest, 'entity.bars: expected list');
  });

  test('Error: Set list of references when expecting reference', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      bar: [
        { id: 'fcc46a9e-2097-4bd6-bb08-56d5f59db26b' },
        { id: 'fcc46a9e-2097-4bd6-bb08-56d5f59db26b' },
      ],
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.bar: expected reference, got list'
    );
  });

  test('Error: value type missing _type', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      twoStrings: { one: 'One', two: 'Two' },
    });
    expectErrorResult(createResult, ErrorType.BadRequest, 'entity.twoStrings: missing _type');
  });

  test('Error: value type with invalid _type', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      twoStrings: { _type: 'Invalid' },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.twoStrings: value type Invalid doesn’t exist'
    );
  });

  test('Error: value type with wrong _type', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      oneString: { _type: 'EntityAdminTwoStrings', one: 'One', two: 'Two' },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.oneString: value of type EntityAdminTwoStrings is not allowed'
    );
  });

  test('Error: value type with invalid field', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      oneString: { _type: 'EntityAdminOneString', one: 'One', invalid: 'value' },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.oneString: Unsupported field names: invalid'
    );
  });

  test('Error: rich text single, where list is expected', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      bodyList: { blocks: [] },
    });
    expectErrorResult(createResult, ErrorType.BadRequest, 'entity.bodyList: expected list');
  });

  test('Error: rich text list, where single is expected', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      body: [{ blocks: [] }],
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.body: expected single value, got list'
    );
  });

  test('Error: rich text, forgotten blocks', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      body: [{ type: RichTextBlockType.paragraph, data: { text: '' } }],
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.body: expected single value, got list'
    );
  });

  test('Error: rich text with string', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      body: 'Hello',
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.body: expected object, got string'
    );
  });

  test('Error: rich text without blocks', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      body: {},
    });
    expectErrorResult(createResult, ErrorType.BadRequest, 'entity.body: missing blocks');
  });

  test('Error: rich text, blocks as string', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      body: { blocks: 'Hello' },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.body.blocks: expected array, got string'
    );
  });

  test('Error: rich text with version and time', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      body: { blocks: [], version: '123', time: 123123 },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.body: unexpected keys version, time'
    );
  });

  test('Error: rich text with invalid block type', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      bodyOnlyParagraph: { blocks: [{ type: RichTextBlockType.entity, data: null }] },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.bodyOnlyParagraph[0]: rich text block of type entity is not allowed'
    );
  });

  test('Error: rich text with block with invalid keys', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      body: {
        blocks: [{ type: RichTextBlockType.entity, data: null, invalid: true, unexpected: false }],
      },
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.body[0]: unexpected keys invalid, unexpected'
    );
  });

  test('Error: single location when list expected', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      locations: { lat: 55.60498, lng: 13.003822 },
    });
    expectErrorResult(createResult, ErrorType.BadRequest, 'entity.locations: expected list');
  });

  test('Error: location list when single item expected', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      location: [{ lat: 55.60498, lng: 13.003822 }],
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.location: expected location, got list'
    );
  });

  test('Error: location with empty object', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      location: {},
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.location: expected {lat: number, lng: number}, got [object Object]'
    );
  });

  test('Error: single value type when list expected', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      twoStringsList: { _type: 'EntityAdminTwoStrings', one: 'One', two: 'Two' },
    });
    expectErrorResult(createResult, ErrorType.BadRequest, 'entity.twoStringsList: expected list');
  });

  test('Error: list of value type when single item expected', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      twoStrings: [
        { _type: 'EntityAdminTwoStrings', one: 'One', two: 'Two' },
        { _type: 'EntityAdminTwoStrings', one: 'One', two: 'Two' },
      ],
    });
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.twoStrings: expected single value, got list'
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

  test('First default, ordered by _name', async () => {
    const result = await client.searchEntities(
      {
        entityTypes: ['AdminOnlyEditBefore'],
        order: '_name',
      },
      { first: 20 }
    );
    if (expectOkResult(result)) {
      expectConnectionToMatchSlice(result.value, 0, 20, (a, b) => {
        return a._name < b._name ? -1 : 1;
      });
    }
  });

  test('Query based on referencing, one reference', async () => {
    const { barId, fooEntities } = await createBarWithFooBazReferences(context, 1, 0);
    const [fooEntity] = fooEntities;

    const searchResult = await client.searchEntities({ referencing: barId });
    expectSearchResultEntities(searchResult, [fooEntity]);
  });

  test('Query based on referencing, no references', async () => {
    const { barId } = await createBarWithFooBazReferences(context, 0, 0);

    const searchResult = await client.searchEntities({ referencing: barId });
    expectResultValue(searchResult, null);
  });

  test('Query based on referencing, two references from one entity', async () => {
    const { barId, bazEntities } = await createBarWithFooBazReferences(context, 0, 1, 2);

    const searchResult = await client.searchEntities({ referencing: barId });
    expectSearchResultEntities(searchResult, bazEntities);
  });

  test('Query based on referencing and entityTypes, one reference', async () => {
    const { barId, bazEntities } = await createBarWithFooBazReferences(context, 1, 1);
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
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      location: center,
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
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      location: outside,
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
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      locations: [center, inside],
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
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      body: {
        blocks: [
          {
            type: RichTextBlockType.valueItem,
            data: {
              _type: 'EntityAdminStringedLocation',
              string: 'Hello location',
              location: center,
            },
          },
        ],
      },
    });

    if (expectOkResult(createResult)) {
      const { id: bazId, _name: bazName } = createResult.value;
      const searchResult = await client.searchEntities({ boundingBox });
      if (expectOkResult(searchResult)) {
        let bazIdCount = 0;
        for (const edge of searchResult.value?.edges ?? []) {
          if (expectOkResult(edge.node)) {
            if (edge.node.value.id === bazId) {
              bazIdCount += 1;

              expectResultValue(edge.node, {
                id: bazId,
                _type: 'EntityAdminBaz',
                _name: bazName,
                _version: 0,
                _publishState: EntityPublishState.Draft,
                ...emptyBazFields,
                body: {
                  blocks: [
                    {
                      type: RichTextBlockType.valueItem,
                      data: {
                        _type: 'EntityAdminStringedLocation',
                        string: 'Hello location',
                        location: center,
                      },
                    },
                  ],
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
      _type: 'EntityAdminFoo',
      _name: 'Foo',
      summary: 'this is some serious summary with the best conclusion',
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
        await EntityAdmin.updateEntity(context, {
          id: fooId,
          summary: "who's jumping? It it the fox",
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
    const { barId } = await createBarWithFooBazReferences(context, 1, 0);

    const result = await client.getTotalCount({ referencing: barId });
    if (expectOkResult(result)) {
      expect(result.value).toBe(1);
    }
  });

  test('Query based on referencing, no references', async () => {
    const { barId } = await createBarWithFooBazReferences(context, 0, 0);

    const result = await client.getTotalCount({ referencing: barId });
    if (expectOkResult(result)) {
      expect(result.value).toBe(0);
    }
  });

  test('Query based on referencing and entityTypes, one reference', async () => {
    const { barId } = await createBarWithFooBazReferences(context, 1, 1);

    const result = await client.getTotalCount({
      entityTypes: ['EntityAdminBaz'],
      referencing: barId,
    });
    if (expectOkResult(result)) {
      expect(result.value).toBe(1);
    }
  });

  test('Query based on referencing, two references from one entity', async () => {
    const { barId } = await createBarWithFooBazReferences(context, 0, 1, 2);

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
      _type: 'EntityAdminBaz',
      _name: 'Baz',
      locations: [center, inside],
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
          _type: 'EntityAdminFoo',
          _name: 'foo',
          summary: 'That was indeed a sensational clown',
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
      _type: 'EntityAdminFoo',
      _name: 'Original',
      title: 'Original',
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;
      let name = createResult.value._name;

      const updateResult = await EntityAdmin.updateEntity(context, {
        id,
        _type: 'EntityAdminFoo',
        _name: 'Updated name',
        title: 'Updated title',
      });
      if (expectOkResult(updateResult)) {
        name = updateResult.value._name;
        expect(name).toMatch(/^Updated name(#[0-9]+)?$/);

        expectResultValue(updateResult, {
          id,
          _type: 'EntityAdminFoo',
          _name: name,
          _version: 1,
          _publishState: EntityPublishState.Draft,
          ...emptyFooFields,
          title: 'Updated title',
        });
      }

      const publishResult = await EntityAdmin.publishEntities(context, [{ id, version: 1 }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

      const historyResult = await EntityAdmin.getEntityHistory(context, id);
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
        _type: 'EntityAdminFoo',
        _name: name, // original name isn't kept
        _version: 0,
        _publishState: EntityPublishState.Published,
        ...emptyFooFields,
        title: 'Original',
      });

      const version1Result = await client.getEntity({ id, version: 1 });
      expectResultValue(version1Result, {
        id,
        _type: 'EntityAdminFoo',
        _name: name,
        _version: 1,
        _publishState: EntityPublishState.Published,
        ...emptyFooFields,
        title: 'Updated title',
      });

      const publishedResult = await PublishedEntity.getEntity(context, id);
      expectResultValue(publishedResult, {
        id,
        _type: 'EntityAdminFoo',
        _name: name,
        ...emptyFooFields,
        title: 'Updated title',
      });
    }
  });

  test('Update EntityAdminFoo w/o publish', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminFoo',
      _name: 'First',
      title: 'First',
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;
      let name = createResult.value._name;

      const publishResult = await EntityAdmin.publishEntities(context, [{ id, version: 0 }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

      const updateResult = await EntityAdmin.updateEntity(context, {
        id,
        _type: 'EntityAdminFoo',
        _name: 'Updated name',
        title: 'Updated title',
      });
      if (expectOkResult(updateResult)) {
        name = updateResult.value._name;
        expect(name).toMatch(/^Updated name(#[0-9]+)?$/);

        expectResultValue(updateResult, {
          id,
          _type: 'EntityAdminFoo',
          _name: name,
          _version: 1,
          _publishState: EntityPublishState.Modified,
          ...emptyFooFields,
          title: 'Updated title',
        });
      }

      const historyResult = await EntityAdmin.getEntityHistory(context, id);
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
        _type: 'EntityAdminFoo',
        _name: name,
        _version: 0,
        _publishState: EntityPublishState.Modified,
        ...emptyFooFields,
        title: 'First',
      });

      const version1Result = await client.getEntity({ id, version: 1 });
      expectResultValue(version1Result, {
        id,
        _type: 'EntityAdminFoo',
        _name: name,
        _version: 1,
        _publishState: EntityPublishState.Modified,
        ...emptyFooFields,
        title: 'Updated title',
      });

      const publishedResult = await PublishedEntity.getEntity(context, id);
      expectResultValue(publishedResult, {
        id,
        _type: 'EntityAdminFoo',
        _name: name,
        ...emptyFooFields,
        title: 'First',
      });
    }
  });

  test('Update EntityAdminFoo w/o type and name', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminFoo',
      _name: 'Original',
      title: 'Original',
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      const updateResult = await EntityAdmin.updateEntity(context, { id, title: 'Updated title' });
      expectResultValue(updateResult, {
        id,
        _type: 'EntityAdminFoo',
        _name: createResult.value._name,
        _version: 1,
        _publishState: EntityPublishState.Draft,
        ...emptyFooFields,
        title: 'Updated title',
      });

      const publishResult = await EntityAdmin.publishEntities(context, [{ id, version: 1 }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

      const historyResult = await EntityAdmin.getEntityHistory(context, id);
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
        _type: 'EntityAdminFoo',
        _name: createResult.value._name,
        _version: 0,
        _publishState: EntityPublishState.Published,
        ...emptyFooFields,
        title: 'Original',
      });

      const version1Result = await client.getEntity({ id, version: 1 });
      expectResultValue(version1Result, {
        id,
        _type: 'EntityAdminFoo',
        _name: createResult.value._name,
        _version: 1,
        _publishState: EntityPublishState.Published,
        ...emptyFooFields,
        title: 'Updated title',
      });

      const publishedResult = await PublishedEntity.getEntity(context, id);
      expectResultValue(publishedResult, {
        id,
        _type: 'EntityAdminFoo',
        _name: createResult.value._name,
        ...emptyFooFields,
        title: 'Updated title',
      });
    }
  });

  test('Update EntityAdminFoo w/o providing all fields', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminFoo',
      _name: 'First name',
      title: 'First title',
      summary: 'First summary',
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      const updateResult = await EntityAdmin.updateEntity(context, {
        id,
        summary: 'Updated summary',
      });
      expectResultValue(updateResult, {
        id,
        _type: 'EntityAdminFoo',
        _name: createResult.value._name,
        _version: 1,
        _publishState: EntityPublishState.Draft,
        ...emptyFooFields,
        title: 'First title',
        summary: 'Updated summary',
      });

      const publishResult = await EntityAdmin.publishEntities(context, [{ id, version: 1 }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

      const historyResult = await EntityAdmin.getEntityHistory(context, id);
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
        _type: 'EntityAdminFoo',
        _name: createResult.value._name,
        _version: 0,
        _publishState: EntityPublishState.Published,
        ...emptyFooFields,
        title: 'First title',
        summary: 'First summary',
      });

      const version1Result = await client.getEntity({ id, version: 1 });
      expectResultValue(version1Result, {
        id,
        _type: 'EntityAdminFoo',
        _name: createResult.value._name,
        _version: 1,
        _publishState: EntityPublishState.Published,
        ...emptyFooFields,
        title: 'First title',
        summary: 'Updated summary',
      });

      const publishedResult = await PublishedEntity.getEntity(context, id);
      expectResultValue(publishedResult, {
        id,
        _type: 'EntityAdminFoo',
        _name: createResult.value._name,
        ...emptyFooFields,
        title: 'First title',
        summary: 'Updated summary',
      });
    }
  });

  test('Update EntityAdminFoo with the same name', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminFoo',
      _name: 'First name',
      title: 'First title',
      summary: 'First summary',
    });
    if (expectOkResult(createResult)) {
      const { id, _name: name } = createResult.value;

      const updateResult = await EntityAdmin.updateEntity(context, { id, _name: name });
      expectResultValue(updateResult, {
        id,
        _type: 'EntityAdminFoo',
        _name: name,
        _version: 1,
        _publishState: EntityPublishState.Draft,
        ...emptyFooFields,
        title: 'First title',
        summary: 'First summary',
      });

      const publishResult = await EntityAdmin.publishEntities(context, [{ id, version: 1 }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

      const publishedResult = await PublishedEntity.getEntity(context, id);
      expectResultValue(publishedResult, {
        id,
        _type: 'EntityAdminFoo',
        _name: name,
        ...emptyFooFields,
        title: 'First title',
        summary: 'First summary',
      });
    }
  });

  test('Update EntityAdminFoo with reference', async () => {
    const createFooResult = await client.createEntity({
      _type: 'EntityAdminFoo',
      _name: 'First name',
      title: 'First title',
      summary: 'First summary',
    });
    if (expectOkResult(createFooResult)) {
      const { id: fooId } = createFooResult.value;

      const createBarResult = await client.createEntity({
        _type: 'EntityAdminBar',
        _name: 'Bar entity',
        title: 'Bar entity',
      });
      if (expectOkResult(createBarResult)) {
        const { id: barId } = createBarResult.value;

        const updateResult = await EntityAdmin.updateEntity(context, {
          id: fooId,
          bar: { id: barId },
        });
        expectResultValue(updateResult, {
          id: fooId,
          _type: 'EntityAdminFoo',
          _name: createFooResult.value._name,
          _version: 1,
          _publishState: EntityPublishState.Draft,
          title: 'First title',
          summary: 'First summary',
          bar: { id: barId },
        });

        const publishResult = await EntityAdmin.publishEntities(context, [
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
          _type: 'EntityAdminFoo',
          _name: createFooResult.value._name,
          _version: 0,
          _publishState: EntityPublishState.Published,
          ...emptyFooFields,
          title: 'First title',
          summary: 'First summary',
        });

        const version1Result = await client.getEntity({ id: fooId, version: 1 });
        expectResultValue(version1Result, {
          id: fooId,
          _type: 'EntityAdminFoo',
          _name: createFooResult.value._name,
          _version: 1,
          _publishState: EntityPublishState.Published,
          title: 'First title',
          summary: 'First summary',
          bar: { id: barId },
        });

        const publishedResult = await PublishedEntity.getEntity(context, fooId);
        expectResultValue(publishedResult, {
          id: fooId,
          _type: 'EntityAdminFoo',
          _name: createFooResult.value._name,
          title: 'First title',
          summary: 'First summary',
          bar: { id: barId },
        });
      }
    }
  });

  test('Update EntityAdminFoo without changing a reference', async () => {
    const createBar1Result = await client.createEntity({
      _type: 'EntityAdminBar',
      _name: 'Bar 1 entity',
      title: 'Bar 1 entity',
    });
    const createBar2Result = await client.createEntity({
      _type: 'EntityAdminBar',
      _name: 'Bar 2 entity',
      title: 'Bar 2 entity',
    });
    if (expectOkResult(createBar1Result) && expectOkResult(createBar2Result)) {
      const { id: bar1Id } = createBar1Result.value;
      const { id: bar2Id } = createBar2Result.value;

      const publishResult = await EntityAdmin.publishEntities(context, [
        { id: bar1Id, version: 0 },
        { id: bar2Id, version: 0 },
      ]);
      expectResultValue(publishResult, [
        { id: bar1Id, publishState: EntityPublishState.Published },
        { id: bar2Id, publishState: EntityPublishState.Published },
      ]);

      const createBazResult = await client.createEntity({
        _type: 'EntityAdminBaz',
        _name: 'First name',
        title: 'First title',
        bar: { id: bar1Id },
        bars: [{ id: bar1Id }, { id: bar2Id }],
      });
      if (expectOkResult(createBazResult)) {
        const { id: bazId } = createBazResult.value;

        const updateResult = await EntityAdmin.updateEntity(context, {
          id: bazId,
          title: 'Updated title',
        });
        expectResultValue(updateResult, {
          id: bazId,
          _type: 'EntityAdminBaz',
          _name: createBazResult.value._name,
          _version: 1,
          _publishState: EntityPublishState.Draft,
          ...emptyBazFields,
          title: 'Updated title',
          bar: { id: bar1Id },
          bars: [{ id: bar1Id }, { id: bar2Id }],
        });

        const publishResult = await EntityAdmin.publishEntities(context, [
          { id: bazId, version: 1 },
        ]);
        expectResultValue(publishResult, [
          { id: bazId, publishState: EntityPublishState.Published },
        ]);

        const version0Result = await client.getEntity({ id: bazId, version: 0 });
        expectResultValue(version0Result, {
          id: bazId,
          _type: 'EntityAdminBaz',
          _name: createBazResult.value._name,
          _version: 0,
          _publishState: EntityPublishState.Published,
          ...emptyBazFields,
          title: 'First title',
          bar: { id: bar1Id },
          bars: [{ id: bar1Id }, { id: bar2Id }],
        });

        const version1Result = await client.getEntity({ id: bazId, version: 1 });
        expectResultValue(version1Result, {
          id: bazId,
          _type: 'EntityAdminBaz',
          _name: createBazResult.value._name,
          _version: 1,
          _publishState: EntityPublishState.Published,
          ...emptyBazFields,
          title: 'Updated title',
          bar: { id: bar1Id },
          bars: [{ id: bar1Id }, { id: bar2Id }],
        });

        const publishedResult = await PublishedEntity.getEntity(context, bazId);
        expectResultValue(publishedResult, {
          id: bazId,
          _type: 'EntityAdminBaz',
          _name: createBazResult.value._name,
          ...emptyBazFields,
          title: 'Updated title',
          bar: { id: bar1Id },
          bars: [{ id: bar1Id }, { id: bar2Id }],
        });
      }
    }
  });

  test('Update archived EntityAdminFoo', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminFoo',
      _name: 'Original',
      title: 'Original',
    });
    if (expectOkResult(createResult)) {
      const { id, _name: name } = createResult.value;

      const archiveResult = await EntityAdmin.archiveEntity(context, id);
      expectResultValue(archiveResult, { id, publishState: EntityPublishState.Archived });

      const updateResult = await EntityAdmin.updateEntity(context, {
        id,
        title: 'Updated title',
      });

      expectResultValue(updateResult, {
        id,
        _type: 'EntityAdminFoo',
        _name: name,
        _version: 1,
        _publishState: EntityPublishState.Archived,
        ...emptyFooFields,
        title: 'Updated title',
      });
    }
  });

  test('Error: Update with invalid id', async () => {
    const result = await EntityAdmin.updateEntity(context, {
      id: 'f773ac54-37db-42df-9b55-b6da8de344c3',
      _type: 'EntityAdminFoo',
      _name: 'name',
      foo: 'title',
    });

    expectErrorResult(result, ErrorType.NotFound, 'No such entity');
  });

  test('Error: Update with different type', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBar',
      _name: 'foo',
      title: 'foo',
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;
      const updateResult = await EntityAdmin.updateEntity(context, {
        id,
        _type: 'EntityAdminFoo',
        _name: 'name',
        foo: 'title',
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
      _type: 'EntityAdminFoo',
      _name: 'Foo name',
      title: 'Foo title',
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;
      const updateResult = await EntityAdmin.updateEntity(context, { id, invalid: 'hello' });

      expectErrorResult(updateResult, ErrorType.BadRequest, 'Unsupported field names: invalid');
    }
  });

  test('Error: Update EntityAdminFoo with reference to missing entity', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminFoo',
      _name: 'Foo name',
      title: 'Foo title',
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;
      const updateResult = await EntityAdmin.updateEntity(context, {
        id,
        bar: { id: '9783ca4f-f5b4-4f6a-a7bf-aae33e227841' },
      });

      expectErrorResult(
        updateResult,
        ErrorType.BadRequest,
        'entity.bar: referenced entity (9783ca4f-f5b4-4f6a-a7bf-aae33e227841) doesn’t exist'
      );
    }
  });

  test('Error: Update EntityAdminFoo with reference to wrong entity type', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminFoo',
      _name: 'Foo name',
      title: 'Foo title',
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;
      const referenceId = entitiesOfTypeAdminOnlyEditBefore[0].id;

      const updateResult = await EntityAdmin.updateEntity(context, {
        id,
        bar: { id: referenceId },
      });
      expectErrorResult(
        updateResult,
        ErrorType.BadRequest,
        `entity.bar: referenced entity (${referenceId}) has an invalid type AdminOnlyEditBefore`
      );
    }
  });
});

describe('publishEntities()', () => {
  test('Two entities referencing each other', async () => {
    const createBaz1Result = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz 1',
      title: 'Baz title 1',
    });
    if (expectOkResult(createBaz1Result)) {
      const { id: baz1Id } = createBaz1Result.value;

      const createBaz2Result = await client.createEntity({
        _type: 'EntityAdminBaz',
        _name: 'Baz 2',
        title: 'Baz title 2',
        baz: { id: baz1Id },
      });
      if (expectOkResult(createBaz2Result)) {
        const { id: baz2Id } = createBaz2Result.value;

        expectOkResult(
          await EntityAdmin.updateEntity(context, { id: baz1Id, baz: { id: baz2Id } })
        );

        const publishResult = await EntityAdmin.publishEntities(context, [
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
      _type: 'EntityAdminBaz',
      _name: 'Baz 1',
      title: 'Baz title 1',
    });
    if (expectOkResult(createBaz1Result)) {
      const { id, _name: name, _version: version } = createBaz1Result.value;

      const archiveResult = await EntityAdmin.archiveEntity(context, id);
      expectResultValue(archiveResult, { id, publishState: EntityPublishState.Archived });

      const publishResult = await EntityAdmin.publishEntities(context, [{ id, version }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, {
        id,
        _type: 'EntityAdminBaz',
        _name: name,
        _version: 0,
        _publishState: EntityPublishState.Published,
        ...emptyBazFields,
        title: 'Baz title 1',
      });
    }
  });

  test('Error: Publish published version', async () => {
    const createBazResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz 1',
      title: 'Baz title 1',
    });
    if (expectOkResult(createBazResult)) {
      const { id: bazId } = createBazResult.value;

      const firstPublishResult = await EntityAdmin.publishEntities(context, [
        { id: bazId, version: 0 },
      ]);
      expectResultValue(firstPublishResult, [
        { id: bazId, publishState: EntityPublishState.Published },
      ]);

      const secondPublishResult = await EntityAdmin.publishEntities(context, [
        { id: bazId, version: 0 },
      ]);
      expectErrorResult(
        secondPublishResult,
        ErrorType.BadRequest,
        `Entity versions are already published: ${bazId}`
      );
    }
  });

  test('Error: Reference to unpublished entity', async () => {
    const createBarResult = await client.createEntity({
      _type: 'EntityAdminBar',
      _name: 'Bar name',
      title: 'Bar title',
    });
    if (expectOkResult(createBarResult)) {
      const barId = createBarResult.value.id;

      const createFooResult = await client.createEntity({
        _type: 'EntityAdminFoo',
        _name: 'Foo name',
        title: 'Foo title',
        bar: { id: barId },
      });
      if (expectOkResult(createFooResult)) {
        const { id: fooId } = createFooResult.value;

        const publishResult = await EntityAdmin.publishEntities(context, [
          { id: fooId, version: 0 },
        ]);
        expectErrorResult(
          publishResult,
          ErrorType.BadRequest,
          `${fooId}: References unpublished entities: ${barId}`
        );
      }
    }
  });

  test('Error: Duplicate ids', async () => {
    const publishResult = await EntityAdmin.publishEntities(context, [
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
    const publishResult = await EntityAdmin.publishEntities(context, [
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
      _type: 'EntityAdminFoo',
      _name: 'Foo name',
      title: 'Foo title',
    });
    if (expectOkResult(createFooResult)) {
      const { id: fooId } = createFooResult.value;
      const publishResult = await EntityAdmin.publishEntities(context, [
        { id: fooId, version: 100 },
      ]);
      expectErrorResult(publishResult, ErrorType.NotFound, `No such entities: ${fooId}`);
    }
  });
});

describe('unpublishEntities()', () => {
  test('Sets published state to withdrawn', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz 1',
      title: 'Baz title 1',
    });
    if (expectOkResult(createResult)) {
      const { id, _name: name, _version: version } = createResult.value;

      const publishResult = await EntityAdmin.publishEntities(context, [{ id, version }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

      const unpublishResult = await EntityAdmin.unpublishEntities(context, [id]);
      expectResultValue(unpublishResult, [{ id, publishState: EntityPublishState.Withdrawn }]);

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, {
        id,
        _type: 'EntityAdminBaz',
        _name: name,
        _version: 0,
        _publishState: EntityPublishState.Withdrawn,
        ...emptyBazFields,
        title: 'Baz title 1',
      });
    }
  });

  test('Two published entities referencing each other', async () => {
    const createBaz1Result = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz 1',
      title: 'Baz title 1',
    });
    if (expectOkResult(createBaz1Result)) {
      const { id: baz1Id } = createBaz1Result.value;

      const createBaz2Result = await client.createEntity({
        _type: 'EntityAdminBaz',
        _name: 'Baz 2',
        title: 'Baz title 2',
        baz: { id: baz1Id },
      });
      if (expectOkResult(createBaz2Result)) {
        const { id: baz2Id } = createBaz2Result.value;

        expectOkResult(
          await EntityAdmin.updateEntity(context, { id: baz1Id, baz: { id: baz2Id } })
        );

        const publishResult = await EntityAdmin.publishEntities(context, [
          { id: baz1Id, version: 1 },
          { id: baz2Id, version: 0 },
        ]);
        expectResultValue(publishResult, [
          { id: baz1Id, publishState: EntityPublishState.Published },
          { id: baz2Id, publishState: EntityPublishState.Published },
        ]);

        const unpublishResult = await EntityAdmin.unpublishEntities(context, [baz1Id, baz2Id]);
        expectResultValue(unpublishResult, [
          { id: baz1Id, publishState: EntityPublishState.Withdrawn },
          { id: baz2Id, publishState: EntityPublishState.Withdrawn },
        ]);
      }
    }
  });

  test('Unpublished entity referencing', async () => {
    const createBaz1Result = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz 1',
      title: 'Baz title 1',
    });
    if (expectOkResult(createBaz1Result)) {
      const { id: baz1Id } = createBaz1Result.value;

      const createBaz2Result = await client.createEntity({
        _type: 'EntityAdminBaz',
        _name: 'Baz 2',
        title: 'Baz title 2',
        baz: { id: baz1Id },
      });
      if (expectOkResult(createBaz2Result)) {
        const publishResult = await EntityAdmin.publishEntities(context, [
          { id: baz1Id, version: 0 },
        ]);
        expectResultValue(publishResult, [
          { id: baz1Id, publishState: EntityPublishState.Published },
        ]);

        const unpublishResult = await EntityAdmin.unpublishEntities(context, [baz1Id]);
        expectResultValue(unpublishResult, [
          { id: baz1Id, publishState: EntityPublishState.Withdrawn },
        ]);
      }
    }
  });

  test('Error: invalid id', async () => {
    const publishResult = await EntityAdmin.unpublishEntities(context, [
      '8a678bad-fa57-4f18-a377-633f704fd0d3',
    ]);
    expectErrorResult(
      publishResult,
      ErrorType.NotFound,
      `No such entities: 8a678bad-fa57-4f18-a377-633f704fd0d3`
    );
  });

  test('Error: Reference from published entity', async () => {
    const createBarResult = await client.createEntity({
      _type: 'EntityAdminBar',
      _name: 'Bar name',
      title: 'Bar title',
    });
    if (expectOkResult(createBarResult)) {
      const { id: barId } = createBarResult.value;

      const createFooResult = await client.createEntity({
        _type: 'EntityAdminFoo',
        _name: 'Foo name',
        title: 'Foo title',
        bar: { id: barId },
      });
      if (expectOkResult(createFooResult)) {
        const { id: fooId } = createFooResult.value;

        const publishResult = await EntityAdmin.publishEntities(context, [
          { id: fooId, version: 0 },
          { id: barId, version: 0 },
        ]);
        expectResultValue(publishResult, [
          { id: fooId, publishState: EntityPublishState.Published },
          { id: barId, publishState: EntityPublishState.Published },
        ]);

        const unpublishResult = await EntityAdmin.unpublishEntities(context, [barId]);
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
      _type: 'EntityAdminBar',
      _name: 'Bar name',
      title: 'Bar title',
    });
    if (expectOkResult(createBarResult)) {
      const { id: barId } = createBarResult.value;

      const publishResult = await EntityAdmin.unpublishEntities(context, [barId]);
      expectErrorResult(
        publishResult,
        ErrorType.BadRequest,
        `Entities are not published: ${barId}`
      );
    }
  });

  test('Error: Unpublish archived entity', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBaz',
      _name: 'Baz 1',
      title: 'Baz title 1',
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      const archiveResult = await EntityAdmin.archiveEntity(context, id);
      expectResultValue(archiveResult, { id, publishState: EntityPublishState.Archived });

      expectErrorResult(
        await EntityAdmin.unpublishEntities(context, [id]),
        ErrorType.BadRequest,
        `Entities are not published: ${id}`
      );
    }
  });

  test('Error: duplicate ids', async () => {
    const unpublishResult = await EntityAdmin.unpublishEntities(context, [
      'b1bdcb61-e6aa-47ff-98d8-4cfe8197b290',
      'b1bdcb61-e6aa-47ff-98d8-4cfe8197b290',
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
      _type: 'EntityAdminBar',
      _name: 'Bar name',
      title: 'Bar title',
    });
    if (expectOkResult(createResult)) {
      const { id, _name: name } = createResult.value;

      const archiveResult = await EntityAdmin.archiveEntity(context, id);
      expectResultValue(archiveResult, { id, publishState: EntityPublishState.Archived });

      const historyResult = await EntityAdmin.getPublishingHistory(context, id);
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
        _name: name,
        _type: 'EntityAdminBar',
        _version: 0,
        _publishState: EntityPublishState.Archived,
        title: 'Bar title',
      });
    }
  });

  test('Archive archived entity', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBar',
      _name: 'Bar name',
      title: 'Bar title',
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      const archiveResult1 = await EntityAdmin.archiveEntity(context, id);
      expectResultValue(archiveResult1, { id, publishState: EntityPublishState.Archived });

      const archiveResult2 = await EntityAdmin.archiveEntity(context, id);
      expectResultValue(archiveResult2, { id, publishState: EntityPublishState.Archived });

      const historyResult = await EntityAdmin.getPublishingHistory(context, id);
      if (expectOkResult(historyResult)) {
        expect(historyResult.value.events).toHaveLength(1); // no event created by second archive
      }
    }
  });

  test('Error: archive published entity', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBar',
      _name: 'Bar name',
      title: 'Bar title',
    });
    if (expectOkResult(createResult)) {
      const { id, _version: version } = createResult.value;

      const publishResult = await EntityAdmin.publishEntities(context, [{ id, version }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

      const archiveResult = await EntityAdmin.archiveEntity(context, id);
      expectErrorResult(archiveResult, ErrorType.BadRequest, 'Entity is published');
    }
  });

  test('Error: archive with invalid id', async () => {
    const result = await EntityAdmin.archiveEntity(context, '5b14e69f-6612-4ddb-bb42-7be273104486');
    expectErrorResult(result, ErrorType.NotFound, 'No such entity');
  });
});

describe('unarchiveEntity()', () => {
  test('Unarchive new entity (does nothing)', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBar',
      _name: 'Bar name',
      title: 'Bar title',
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      const unarchiveResult = await EntityAdmin.unarchiveEntity(context, id);
      expectResultValue(unarchiveResult, { id, publishState: EntityPublishState.Draft });

      const historyResult = await EntityAdmin.getPublishingHistory(context, id);
      expectResultValue(historyResult, { id, events: [] });
    }
  });

  test('Unarchive archived entity', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBar',
      _name: 'Bar name',
      title: 'Bar title',
    });
    if (expectOkResult(createResult)) {
      const { id, _name: name } = createResult.value;

      const archiveResult = await EntityAdmin.archiveEntity(context, id);
      expectResultValue(archiveResult, { id, publishState: EntityPublishState.Archived });

      const unarchiveResult = await EntityAdmin.unarchiveEntity(context, id);
      expectResultValue(unarchiveResult, { id, publishState: EntityPublishState.Draft });

      const historyResult = await EntityAdmin.getPublishingHistory(context, id);
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
        _name: name,
        _type: 'EntityAdminBar',
        _version: 0,
        _publishState: EntityPublishState.Draft,
        title: 'Bar title',
      });
    }
  });

  test('Unarchive once published, then archived entity', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBar',
      _name: 'Bar name',
      title: 'Bar title',
    });
    if (expectOkResult(createResult)) {
      const { id, _version: version } = createResult.value;

      const publishResult = await EntityAdmin.publishEntities(context, [{ id, version }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

      const unpublishResult = await EntityAdmin.unpublishEntities(context, [id]);
      expectResultValue(unpublishResult, [{ id, publishState: EntityPublishState.Withdrawn }]);

      const archiveResult = await EntityAdmin.archiveEntity(context, id);
      expectResultValue(archiveResult, { id, publishState: EntityPublishState.Archived });

      const unarchiveResult = await EntityAdmin.unarchiveEntity(context, id);
      expectResultValue(unarchiveResult, { id, publishState: EntityPublishState.Withdrawn });
    }
  });

  test('Error: unarchive with invalid id', async () => {
    const result = await EntityAdmin.unarchiveEntity(
      context,
      '5b14e69f-6612-4ddb-bb42-7be273104486'
    );
    expectErrorResult(result, ErrorType.NotFound, 'No such entity');
  });
});

describe('getEntityHistory()', () => {
  // rest is tested elsewhere

  test('Error: Get version history with invalid id', async () => {
    const result = await EntityAdmin.getEntityHistory(
      context,
      '5b14e69f-6612-4ddb-bb42-7be273104486'
    );
    expectErrorResult(result, ErrorType.NotFound, 'No such entity');
  });
});

describe('getPublishingHistory()', () => {
  test('New unpublished entity', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBar',
      _name: 'Unpublished',
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;
      const historyResult = await EntityAdmin.getPublishingHistory(context, id);
      expectResultValue(historyResult, { id, events: [] });
    }
  });

  test('One published version', async () => {
    const createResult = await client.createEntity({
      _type: 'EntityAdminBar',
      _name: 'Published',
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      const publishResult = await EntityAdmin.publishEntities(context, [{ id, version: 0 }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

      const historyResult = await EntityAdmin.getPublishingHistory(context, id);
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
      _type: 'EntityAdminBar',
      _name: 'Published/Unpublished',
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      const publishResult = await EntityAdmin.publishEntities(context, [{ id, version: 0 }]);
      expectResultValue(publishResult, [{ id, publishState: EntityPublishState.Published }]);

      const unpublishResult = await EntityAdmin.unpublishEntities(context, [id]);
      expectResultValue(unpublishResult, [{ id, publishState: EntityPublishState.Withdrawn }]);

      const historyResult = await EntityAdmin.getPublishingHistory(context, id);
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
    const result = await EntityAdmin.getPublishingHistory(
      context,
      '5b14e69f-6612-4ddb-bb42-7be273104486'
    );
    expectErrorResult(result, ErrorType.NotFound, 'No such entity');
  });
});
