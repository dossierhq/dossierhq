import { CoreTestUtils, ErrorType, FieldType } from '@datadata/core';
import type {
  AdminEntity,
  AdminQuery,
  BoundingBox,
  Connection,
  Edge,
  Paging,
} from '@datadata/core';
import type { Server, SessionContext } from '.';
import { EntityAdmin, isPagingForwards, PublishedEntity } from '.';
import { createTestServer, ensureSessionContext, updateSchema } from './ServerTestUtils';
import { expectEntityHistoryVersions, uuidMatcher } from '../test/AdditionalTestUtils';

const { expectErrorResult, expectOkResult } = CoreTestUtils;

let server: Server;
let context: SessionContext;
let entitiesOfTypeAdminOnlyEditBefore: AdminEntity[];
let deletedIdsOfTypeAdminOnlyEditBefore: string[];

beforeAll(async () => {
  server = await createTestServer();
  context = await ensureSessionContext(server, 'test', 'entity-admin');
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
          { name: 'tags', type: FieldType.String, list: true },
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
  if (knownIds.deletedIds.length > 0) {
    deletedIdsOfTypeAdminOnlyEditBefore = knownIds.deletedIds;
  } else {
    deletedIdsOfTypeAdminOnlyEditBefore = await deleteEntities(
      context,
      entitiesOfTypeAdminOnlyEditBefore.slice(0, 10).map((x) => x.id)
    );
  }
});
afterAll(async () => {
  await server.shutdown();
});

async function ensureEntitiesExistForAdminOnlyEditBefore(context: SessionContext) {
  const requestedCount = 50;
  const entitiesOfTypeCount = await EntityAdmin.getTotalCount(context, {
    entityTypes: ['AdminOnlyEditBefore'],
  });

  if (expectOkResult(entitiesOfTypeCount)) {
    for (let count = entitiesOfTypeCount.value; count < requestedCount; count += 1) {
      const random = String(Math.random()).slice(2);
      const createResult = await EntityAdmin.createEntity(
        context,
        { _type: 'AdminOnlyEditBefore', _name: random, message: `Hey ${random}` },
        { publish: true }
      );
      createResult.throwIfError();
    }
  }
}

async function getEntitiesForAdminOnlyEditBefore(context: SessionContext) {
  const entities: AdminEntity[] = [];
  const deletedIds: string[] = [];
  await visitAllEntityPages(
    context,
    { entityTypes: ['AdminOnlyEditBefore'] },
    { first: 100 },
    (connection) => {
      for (const edge of connection.edges) {
        if (edge.node.isOk()) {
          const entity = edge.node.value;
          entities.push(entity);
          if (entity._deleted) {
            deletedIds.push(entity.id);
          }
        }
      }
    }
  );
  return { entities, deletedIds };
}

async function deleteEntities(context: SessionContext, idsToDelete: string[]) {
  for (const id of idsToDelete) {
    expectOkResult(await EntityAdmin.deleteEntity(context, id, { publish: true }));
  }
  return idsToDelete;
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
    const result = await EntityAdmin.searchEntities(context, query, ownPaging);
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

async function createBarWithFooBazReferences(
  context: SessionContext,
  fooCount: number,
  bazCount: number,
  bazReferencesPerEntity = 1
) {
  const createBarResult = await EntityAdmin.createEntity(
    context,
    { _type: 'EntityAdminBar', _name: 'Bar', title: 'Bar' },
    { publish: true }
  );
  if (createBarResult.isError()) {
    throw createBarResult.toError();
  }

  const { id: barId } = createBarResult.value;

  const fooEntities: AdminEntity[] = [];
  const bazEntities: AdminEntity[] = [];

  for (let i = 0; i < fooCount; i += 1) {
    const createFooResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminFoo', _name: 'Foo: ' + i, bar: { id: barId } },
      { publish: true }
    );
    if (expectOkResult(createFooResult)) {
      fooEntities.push(createFooResult.value);
    }
  }
  for (let i = 0; i < bazCount; i += 1) {
    const bars = [...new Array(bazReferencesPerEntity - 1)].map(() => ({ id: barId }));
    const createBazResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminBaz', _name: 'Baz: ' + i, bar: { id: barId }, bars },
      { publish: true }
    );
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
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminFoo', _name: 'Foo', title: 'Title' },
      { publish: true }
    );

    if (expectOkResult(createResult)) {
      const { id } = createResult.value;
      const deleteResult = await EntityAdmin.deleteEntity(context, id, { publish: true });
      expectOkResult(deleteResult);

      const versionMaxResult = await EntityAdmin.getEntity(context, id);
      if (expectOkResult(versionMaxResult)) {
        expect(versionMaxResult.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 1,
          _deleted: true,
        });
      }
    }
  });

  test('Error: Get entity with invalid id', async () => {
    const result = await EntityAdmin.getEntity(context, '13e4c7da-616e-44a3-a039-24f96f9b17da');
    expectErrorResult(result, ErrorType.NotFound, 'No such entity');
  });

  test('Error: Get entity with invalid version', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminFoo', _name: 'Foo', title: 'Title' },
      { publish: true }
    );

    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      const resultMinusOne = await EntityAdmin.getEntity(context, id, -1);
      expectErrorResult(resultMinusOne, ErrorType.NotFound, 'No such entity or version');

      const resultOne = await EntityAdmin.getEntity(context, id, 1);
      expectErrorResult(resultOne, ErrorType.NotFound, 'No such entity or version');
    }
  });
});

describe('getEntities()', () => {
  test('Get no entities', async () => {
    const result = await EntityAdmin.getEntities(context, []);
    expect(result).toHaveLength(0);
  });

  test('Get 2 entities', async () => {
    const createFoo1Result = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminFoo', _name: 'Foo', title: 'Title 1' },
      { publish: true }
    );
    const createFoo2Result = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminFoo', _name: 'Foo', title: 'Title 2' },
      { publish: true }
    );

    if (expectOkResult(createFoo1Result) && expectOkResult(createFoo2Result)) {
      const { id: foo1Id, _name: foo1Name } = createFoo1Result.value;
      const { id: foo2Id, _name: foo2Name } = createFoo2Result.value;

      const result = await EntityAdmin.getEntities(context, [foo2Id, foo1Id]);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        value: {
          _type: 'EntityAdminFoo',
          id: foo2Id,
          _name: foo2Name,
          _version: 0,
          title: 'Title 2',
        },
      });
      expect(result[1]).toEqual({
        value: {
          _type: 'EntityAdminFoo',
          id: foo1Id,
          _name: foo1Name,
          _version: 0,
          title: 'Title 1',
        },
      });
    }
  });

  test('Gets the last version', async () => {
    const createFooResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminFoo', _name: 'Foo', title: 'First title' },
      { publish: true }
    );

    if (expectOkResult(createFooResult)) {
      const { id: fooId, _name: fooName } = createFooResult.value;

      expectOkResult(
        await EntityAdmin.updateEntity(
          context,
          { id: fooId, title: 'Updated title' },
          { publish: false }
        )
      );

      const result = await EntityAdmin.getEntities(context, [fooId]);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        value: {
          _type: 'EntityAdminFoo',
          id: fooId,
          _name: fooName,
          _version: 1,
          title: 'Updated title',
        },
      });
    }
  });

  test('Error: Get entities with invalid ids', async () => {
    const result = await EntityAdmin.getEntities(context, [
      '13e4c7da-616e-44a3-a039-24f96f9b17da',
      '13e4c7da-616e-44a3-44a3-24f96f9b17da',
    ]);
    expect(result).toHaveLength(2);
    expectErrorResult(result[0], ErrorType.NotFound, 'No such entity');
    expectErrorResult(result[1], ErrorType.NotFound, 'No such entity');
  });
});

describe('createEntity()', () => {
  test('Create EntityAdminFoo and publish', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminFoo', _name: 'Foo', title: 'Title' },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id, _name: name } = createResult.value;
      expect(id).toMatch(uuidMatcher);
      expect(name).toMatch(/^Foo(#[0-9]+)?$/);

      expect(createResult.value).toEqual({
        id,
        _type: 'EntityAdminFoo',
        _name: name,
        _version: 0,
        title: 'Title',
      });

      const historyResult = await EntityAdmin.getEntityHistory(context, id);
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            deleted: false,
            published: true,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await EntityAdmin.getEntity(context, id, 0);
      if (expectOkResult(version0Result)) {
        expect(version0Result.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: name,
          _version: 0,
          title: 'Title',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: name,
          title: 'Title',
        });
      }
    }
  });

  test('Create EntityAdminFoo w/o publish', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminFoo', _name: 'Draft', title: 'Draft' },
      { publish: false }
    );
    if (expectOkResult(createResult)) {
      expect(createResult.value.id).toMatch(uuidMatcher);
      const { id } = createResult.value;

      expect(createResult.value).toEqual({
        id,
        _type: 'EntityAdminFoo',
        _name: createResult.value._name,
        _version: 0,
        title: 'Draft',
      });

      const historyResult = await EntityAdmin.getEntityHistory(context, id);
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            deleted: false,
            published: false,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await EntityAdmin.getEntity(context, id, 0);
      if (expectOkResult(version0Result)) {
        expect(version0Result.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 0,
          title: 'Draft',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      expectErrorResult(publishedResult, ErrorType.NotFound, 'No such entity');
    }
  });

  test('Create EntityAdminFoo with reference to Bar', async () => {
    const createBarResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminBar', _name: 'Bar name', title: 'Bar title' },
      { publish: true }
    );
    if (expectOkResult(createBarResult)) {
      const barId = createBarResult.value.id;
      const createFooResult = await EntityAdmin.createEntity(
        context,
        { _type: 'EntityAdminFoo', _name: 'Foo name', title: 'Foo title', bar: { id: barId } },
        { publish: true }
      );
      if (expectOkResult(createFooResult)) {
        expect(createFooResult.value.id).toMatch(uuidMatcher);
        const fooId = createFooResult.value.id;

        expect(createFooResult.value).toEqual({
          id: fooId,
          _type: 'EntityAdminFoo',
          _name: createFooResult.value._name,
          _version: 0,
          title: 'Foo title',
          bar: { id: barId },
        });

        const fooVersion0Result = await EntityAdmin.getEntity(context, fooId, 0);
        if (expectOkResult(fooVersion0Result)) {
          expect(fooVersion0Result.value).toEqual({
            id: fooId,
            _type: 'EntityAdminFoo',
            _name: createFooResult.value._name,
            _version: 0,
            title: 'Foo title',
            bar: { id: barId },
          });
        }

        const publishedFooResult = await PublishedEntity.getEntity(context, fooId);
        if (expectOkResult(publishedFooResult)) {
          expect(publishedFooResult.value).toEqual({
            id: fooId,
            _type: 'EntityAdminFoo',
            _name: createFooResult.value._name,
            title: 'Foo title',
            bar: { id: barId },
          });
        }
      }
    }
  });

  test('Create EntityAdminBaz with string list', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminBaz', _name: 'Baz', tags: ['one', 'two', 'three'] },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id, _name: name } = createResult.value;
      expect(createResult.value).toEqual({
        id,
        _type: 'EntityAdminBaz',
        _name: name,
        _version: 0,
        tags: ['one', 'two', 'three'],
      });

      const getResult = await EntityAdmin.getEntity(context, id);
      if (expectOkResult(getResult)) {
        expect(getResult.value).toEqual({
          id,
          _type: 'EntityAdminBaz',
          _name: name,
          _version: 0,
          tags: ['one', 'two', 'three'],
        });
      }
    }
  });

  test('Create EntityAdminBaz with location and location list', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminBaz',
        _name: 'Baz',
        location: { lat: 55.60498, lng: 13.003822 },
        locations: [
          { lat: 55.60498, lng: 13.003822 },
          { lat: 56.381561, lng: 13.99286 },
        ],
      },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id, _name: name } = createResult.value;
      expect(createResult.value).toEqual({
        id,
        _type: 'EntityAdminBaz',
        _name: name,
        _version: 0,
        location: { lat: 55.60498, lng: 13.003822 },
        locations: [
          { lat: 55.60498, lng: 13.003822 },
          { lat: 56.381561, lng: 13.99286 },
        ],
      });

      const getResult = await EntityAdmin.getEntity(context, id);
      if (expectOkResult(getResult)) {
        expect(getResult.value).toEqual({
          id,
          _type: 'EntityAdminBaz',
          _name: name,
          _version: 0,
          location: { lat: 55.60498, lng: 13.003822 },
          locations: [
            { lat: 55.60498, lng: 13.003822 },
            { lat: 56.381561, lng: 13.99286 },
          ],
        });
      }
    }
  });

  test('Create EntityAdminBaz with reference list', async () => {
    const createBar1Result = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminBar', _name: 'Bar1' },
      { publish: true }
    );
    const createBar2Result = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminBar', _name: 'Bar2' },
      { publish: true }
    );

    if (expectOkResult(createBar1Result) && expectOkResult(createBar2Result)) {
      const { id: bar1Id } = createBar1Result.value;
      const { id: bar2Id } = createBar2Result.value;

      const createBazResult = await EntityAdmin.createEntity(
        context,
        { _type: 'EntityAdminBaz', _name: 'Baz', bars: [{ id: bar1Id }, { id: bar2Id }] },
        { publish: true }
      );
      if (expectOkResult(createBazResult)) {
        const { id, _name: name } = createBazResult.value;
        expect(createBazResult.value).toEqual({
          id,
          _type: 'EntityAdminBaz',
          _name: name,
          _version: 0,
          bars: [{ id: bar1Id }, { id: bar2Id }],
        });

        const getResult = await EntityAdmin.getEntity(context, id);
        if (expectOkResult(getResult)) {
          expect(getResult.value).toEqual({
            id,
            _type: 'EntityAdminBaz',
            _name: name,
            _version: 0,
            bars: [{ id: bar1Id }, { id: bar2Id }],
          });
        }

        const referencesTo1 = await EntityAdmin.searchEntities(context, { referencing: bar1Id });
        if (expectOkResult(referencesTo1)) {
          expect(referencesTo1.value?.edges.map((x) => x.node)).toEqual([
            {
              value: {
                id,
                _type: 'EntityAdminBaz',
                _name: name,
                _version: 0,
                bars: [{ id: bar1Id }, { id: bar2Id }],
              },
            },
          ]);
        }

        const referencesTo2 = await EntityAdmin.searchEntities(context, { referencing: bar2Id });
        if (expectOkResult(referencesTo2)) {
          expect(referencesTo2.value?.edges.map((x) => x.node)).toEqual([
            {
              value: {
                id,
                _type: 'EntityAdminBaz',
                _name: name,
                _version: 0,
                bars: [{ id: bar1Id }, { id: bar2Id }],
              },
            },
          ]);
        }
      }
    }
  });

  test('Create EntityAdminBaz with EntityAdminTwoStrings value type', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminBaz',
        _name: 'Baz',
        twoStrings: { _type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' },
      },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id, _name: name } = createResult.value;
      expect(createResult.value).toEqual({
        id,
        _type: 'EntityAdminBaz',
        _name: name,
        _version: 0,
        twoStrings: { _type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' },
      });

      const getResult = await EntityAdmin.getEntity(context, id);
      if (expectOkResult(getResult)) {
        expect(getResult.value).toEqual({
          id,
          _type: 'EntityAdminBaz',
          _name: name,
          _version: 0,
          twoStrings: { _type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' },
        });
      }
    }
  });

  test('Create EntityAdminBaz with list of EntityAdminTwoStrings value type', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminBaz',
        _name: 'Baz',
        twoStringsList: [
          { _type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' },
          { _type: 'EntityAdminTwoStrings', one: 'Three', two: 'Four' },
        ],
      },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id, _name: name } = createResult.value;
      expect(createResult.value).toEqual({
        id,
        _type: 'EntityAdminBaz',
        _name: name,
        _version: 0,
        twoStringsList: [
          { _type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' },
          { _type: 'EntityAdminTwoStrings', one: 'Three', two: 'Four' },
        ],
      });

      const getResult = await EntityAdmin.getEntity(context, id);
      if (expectOkResult(getResult)) {
        expect(getResult.value).toEqual({
          id,
          _type: 'EntityAdminBaz',
          _name: name,
          _version: 0,
          twoStringsList: [
            { _type: 'EntityAdminTwoStrings', one: 'First', two: 'Second' },
            { _type: 'EntityAdminTwoStrings', one: 'Three', two: 'Four' },
          ],
        });
      }
    }
  });

  test('Create EntityAdminBaz with EntityAdminStringReference value type', async () => {
    const createBarResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminBar', _name: 'Bar' },
      { publish: true }
    );
    if (expectOkResult(createBarResult)) {
      const { id: barId } = createBarResult.value;

      const createBazResult = await EntityAdmin.createEntity(
        context,
        {
          _type: 'EntityAdminBaz',
          _name: 'Baz',
          stringReference: {
            _type: 'EntityAdminStringReference',
            string: 'Hello string',
            reference: { id: barId },
          },
        },
        { publish: true }
      );
      if (expectOkResult(createBazResult)) {
        const { id: bazId, _name: bazName } = createBazResult.value;
        expect(createBazResult.value).toEqual({
          id: bazId,
          _type: 'EntityAdminBaz',
          _name: bazName,
          _version: 0,
          stringReference: {
            _type: 'EntityAdminStringReference',
            string: 'Hello string',
            reference: { id: barId },
          },
        });

        const getResult = await EntityAdmin.getEntity(context, bazId);
        if (expectOkResult(getResult)) {
          expect(getResult.value).toEqual({
            id: bazId,
            _type: 'EntityAdminBaz',
            _name: bazName,
            _version: 0,
            stringReference: {
              _type: 'EntityAdminStringReference',
              string: 'Hello string',
              reference: { id: barId },
            },
          });
        }

        const barReferences = await EntityAdmin.searchEntities(context, { referencing: barId });
        expect(barReferences.isOk() && barReferences.value?.edges.map((x) => x.node)).toEqual([
          {
            value: {
              id: bazId,
              _type: 'EntityAdminBaz',
              _name: bazName,
              _version: 0,
              stringReference: {
                _type: 'EntityAdminStringReference',
                string: 'Hello string',
                reference: { id: barId },
              },
            },
          },
        ]);
      }
    }
  });

  test('Create EntityAdminBaz with EntityAdminListFields value type', async () => {
    const createBar1Result = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminBar', _name: 'Bar 1' },
      { publish: true }
    );
    const createBar2Result = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminBar', _name: 'Bar 2' },
      { publish: true }
    );
    if (expectOkResult(createBar1Result) && expectOkResult(createBar2Result)) {
      const { id: bar1Id } = createBar1Result.value;
      const { id: bar2Id } = createBar2Result.value;

      const createBazResult = await EntityAdmin.createEntity(
        context,
        {
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
        },
        { publish: true }
      );
      if (expectOkResult(createBazResult)) {
        const { id: bazId, _name: bazName } = createBazResult.value;
        expect(createBazResult.value).toEqual({
          id: bazId,
          _type: 'EntityAdminBaz',
          _name: bazName,
          _version: 0,
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

        const getResult = await EntityAdmin.getEntity(context, bazId);
        if (expectOkResult(getResult)) {
          expect(getResult.value).toEqual({
            id: bazId,
            _type: 'EntityAdminBaz',
            _name: bazName,
            _version: 0,
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
        }

        const bar1References = await EntityAdmin.searchEntities(context, { referencing: bar1Id });
        expect(
          bar1References.isOk() &&
            bar1References.value?.edges.map((x) => (x.node.isOk() ? x.node.value.id : null))
        ).toEqual([bazId]);

        const bar2References = await EntityAdmin.searchEntities(context, { referencing: bar2Id });
        expect(
          bar2References.isOk() &&
            bar2References.value?.edges.map((x) => (x.node.isOk() ? x.node.value.id : null))
        ).toEqual([bazId]);
      }
    }
  });

  test('Create EntityAdminBaz with EntityAdminNested value type', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
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
      },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id: bazId, _name: bazName } = createResult.value;
      expect(createResult.value).toEqual({
        id: bazId,
        _type: 'EntityAdminBaz',
        _name: bazName,
        _version: 0,
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

      const getResult = await EntityAdmin.getEntity(context, bazId);
      if (expectOkResult(getResult)) {
        expect(getResult.value).toEqual({
          id: bazId,
          _type: 'EntityAdminBaz',
          _name: bazName,
          _version: 0,
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
    }
  });

  test('Error: Create with invalid type', async () => {
    const result = await EntityAdmin.createEntity(
      context,
      { _type: 'Invalid', _name: 'name', foo: 'title' },
      { publish: false }
    );

    expectErrorResult(result, ErrorType.BadRequest, 'Entity type Invalid doesn’t exist');
  });

  test('Error: Create without _type', async () => {
    const result = await EntityAdmin.createEntity(
      context,
      { _type: '', _name: 'Foo', foo: 'title' },
      { publish: false }
    );

    expectErrorResult(result, ErrorType.BadRequest, 'Missing entity._type');
  });

  test('Error: Create without _name', async () => {
    const result = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminFoo', _name: '', title: 'title' },
      { publish: false }
    );

    expectErrorResult(result, ErrorType.BadRequest, 'Missing entity._name');
  });

  test('Error: Create with invalid field', async () => {
    const result = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminFoo', _name: 'Foo', invalid: 'hello' },
      { publish: false }
    );

    expectErrorResult(result, ErrorType.BadRequest, 'Unsupported field names: invalid');
  });

  test('Error: Create EntityAdminFoo with reference to missing entity', async () => {
    const result = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminFoo',
        _name: 'Foo name',
        title: 'Foo title',
        bar: { id: 'fcc46a9e-2097-4bd6-bb08-56d5f59db26b' },
      },
      { publish: true }
    );
    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'entity.bar: referenced entity (fcc46a9e-2097-4bd6-bb08-56d5f59db26b) doesn’t exist'
    );
  });

  test('Error: Create EntityAdminFoo with reference to wrong entity type', async () => {
    const referenceId = entitiesOfTypeAdminOnlyEditBefore[0].id;
    const result = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminFoo',
        _name: 'Foo name',
        title: 'Foo title',
        bar: { id: referenceId },
      },
      { publish: true }
    );
    expectErrorResult(
      result,
      ErrorType.BadRequest,
      `entity.bar: referenced entity (${referenceId}) has an invalid type AdminOnlyEditBefore`
    );
  });

  test('Error: Set string when expecting list of string', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminBaz', _name: 'Baz', tags: 'invalid' },
      { publish: true }
    );
    expectErrorResult(createResult, ErrorType.BadRequest, 'entity.tags: expected list');
  });

  test('Error: Set list of string when expecting string', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminBaz', _name: 'Baz', title: ['invalid', 'foo'] },
      { publish: true }
    );
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.title: expected string, got list'
    );
  });

  test('Error: Set reference when expecting list of references', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminBaz',
        _name: 'Baz',
        bars: { id: 'fcc46a9e-2097-4bd6-bb08-56d5f59db26b' },
      },
      { publish: true }
    );
    expectErrorResult(createResult, ErrorType.BadRequest, 'entity.bars: expected list');
  });

  test('Error: Set list of references when expecting reference', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminBaz',
        _name: 'Baz',
        bar: [
          { id: 'fcc46a9e-2097-4bd6-bb08-56d5f59db26b' },
          { id: 'fcc46a9e-2097-4bd6-bb08-56d5f59db26b' },
        ],
      },
      { publish: true }
    );
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.bar: expected reference, got list'
    );
  });

  test('Error: value type missing _type', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminBaz',
        _name: 'Baz',
        twoStrings: { one: 'One', two: 'Two' },
      },
      { publish: true }
    );
    expectErrorResult(createResult, ErrorType.BadRequest, 'entity.twoStrings: missing _type');
  });

  test('Error: value type with invalid _type', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminBaz',
        _name: 'Baz',
        twoStrings: { _type: 'Invalid' },
      },
      { publish: true }
    );
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.twoStrings: value type Invalid doesn’t exist'
    );
  });

  test('Error: value type with wrong _type', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminBaz',
        _name: 'Baz',
        oneString: { _type: 'EntityAdminTwoStrings', one: 'One', two: 'Two' },
      },
      { publish: true }
    );
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.oneString: value of type EntityAdminTwoStrings is not allowed'
    );
  });

  test('Error: value type with invalid field', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminBaz',
        _name: 'Baz',
        oneString: { _type: 'EntityAdminOneString', one: 'One', invalid: 'value' },
      },
      { publish: true }
    );
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.oneString: Unsupported field names: invalid'
    );
  });

  test('Error: single location when list expected', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminBaz',
        _name: 'Baz',
        locations: { lat: 55.60498, lng: 13.003822 },
      },
      { publish: true }
    );
    expectErrorResult(createResult, ErrorType.BadRequest, 'entity.locations: expected list');
  });

  test('Error: location list when single item expected', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminBaz',
        _name: 'Baz',
        location: [{ lat: 55.60498, lng: 13.003822 }],
      },
      { publish: true }
    );
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.location: expected location, got list'
    );
  });

  test('Error: location with empty object', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminBaz',
        _name: 'Baz',
        location: {},
      },
      { publish: true }
    );
    expectErrorResult(
      createResult,
      ErrorType.BadRequest,
      'entity.location: expected {lat: number, lng: number}, got [object Object]'
    );
  });

  test('Error: single value type when list expected', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminBaz',
        _name: 'Baz',
        twoStringsList: { _type: 'EntityAdminTwoStrings', one: 'One', two: 'Two' },
      },
      { publish: true }
    );
    expectErrorResult(createResult, ErrorType.BadRequest, 'entity.twoStringsList: expected list');
  });

  test('Error: list of value type when single item expected', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminBaz',
        _name: 'Baz',
        twoStrings: [
          { _type: 'EntityAdminTwoStrings', one: 'One', two: 'Two' },
          { _type: 'EntityAdminTwoStrings', one: 'One', two: 'Two' },
        ],
      },
      { publish: true }
    );
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
    const result = await EntityAdmin.searchEntities(context, {
      entityTypes: ['AdminOnlyEditBefore'],
    });
    if (expectOkResult(result)) {
      expectConnectionToMatchSlice(result.value, 0, 25);
    }
  });

  test('First', async () => {
    const result = await EntityAdmin.searchEntities(
      context,
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
    const result = await EntityAdmin.searchEntities(
      context,
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
    const result = await EntityAdmin.searchEntities(
      context,
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
    const result = await EntityAdmin.searchEntities(
      context,
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
    const firstResult = await EntityAdmin.searchEntities(
      context,
      {
        entityTypes: ['AdminOnlyEditBefore'],
      },
      { first: 10 }
    );
    if (expectOkResult(firstResult)) {
      const secondResult = await EntityAdmin.searchEntities(
        context,
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
    const firstResult = await EntityAdmin.searchEntities(
      context,
      {
        entityTypes: ['AdminOnlyEditBefore'],
      },
      { last: 10 }
    );
    if (expectOkResult(firstResult)) {
      const secondResult = await EntityAdmin.searchEntities(
        context,
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
    const firstResult = await EntityAdmin.searchEntities(
      context,
      {
        entityTypes: ['AdminOnlyEditBefore'],
      },
      { first: 20 }
    );
    if (expectOkResult(firstResult)) {
      const secondResult = await EntityAdmin.searchEntities(
        context,
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
    const firstResult = await EntityAdmin.searchEntities(
      context,
      {
        entityTypes: ['AdminOnlyEditBefore'],
      },
      { first: 20 }
    );
    if (expectOkResult(firstResult)) {
      const secondResult = await EntityAdmin.searchEntities(
        context,
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
    const result = await EntityAdmin.searchEntities(
      context,
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

  test('Deleted entities are reported as such', async () => {
    let deletedCount = 0;
    let notDeletedCount = 0;

    await visitAllEntityPages(
      context,
      { entityTypes: ['AdminOnlyEditBefore'] },
      { first: 50 },
      (connection) => {
        for (const edge of connection.edges) {
          if (edge.node.isOk()) {
            const entity = edge.node.value;
            if (entity._deleted) {
              expect(deletedIdsOfTypeAdminOnlyEditBefore.indexOf(entity.id)).toBeGreaterThanOrEqual(
                0
              );
              deletedCount += 1;
            } else {
              expect(deletedIdsOfTypeAdminOnlyEditBefore.indexOf(entity.id)).toBeLessThan(0);
              notDeletedCount += 1;
            }
          }
        }
      }
    );

    expect(deletedCount).toBeGreaterThan(0);
    expect(notDeletedCount).toBeGreaterThan(0);
  });

  test('Query based on referencing, one reference', async () => {
    const { barId, fooEntities } = await createBarWithFooBazReferences(context, 1, 0);
    const [fooEntity] = fooEntities;

    const searchResult = await EntityAdmin.searchEntities(context, { referencing: barId });
    if (expectOkResult(searchResult)) {
      expect(searchResult.value?.edges).toHaveLength(1);
      expect(searchResult.value?.edges[0].node).toEqual({
        value: fooEntity,
      });
    }
  });

  test('Query based on referencing, no references', async () => {
    const { barId } = await createBarWithFooBazReferences(context, 0, 0);

    const searchResult = await EntityAdmin.searchEntities(context, { referencing: barId });
    if (expectOkResult(searchResult)) {
      expect(searchResult.value).toBeNull();
    }
  });

  test('Query based on referencing, two references from one entity', async () => {
    const { barId, bazEntities } = await createBarWithFooBazReferences(context, 0, 1, 2);

    const searchResult = await EntityAdmin.searchEntities(context, { referencing: barId });
    if (expectOkResult(searchResult)) {
      expect(searchResult.value?.edges).toHaveLength(1);
      expect(searchResult.value?.edges[0].node).toEqual({
        value: bazEntities[0],
      });
    }
  });

  test('Query based on referencing and entityTypes, one reference', async () => {
    const { barId, bazEntities } = await createBarWithFooBazReferences(context, 1, 1);
    const [bazEntity] = bazEntities;

    const searchResult = await EntityAdmin.searchEntities(context, {
      entityTypes: ['EntityAdminBaz'],
      referencing: barId,
    });
    if (expectOkResult(searchResult)) {
      expect(searchResult.value?.edges).toHaveLength(1);
      expect(searchResult.value?.edges[0].node).toEqual({
        value: bazEntity,
      });
    }
  });

  test('Query based on bounding box', async () => {
    const boundingBox = randomBoundingBox();
    const center = {
      lat: (boundingBox.minLat + boundingBox.maxLat) / 2,
      lng: (boundingBox.minLng + boundingBox.maxLng) / 2,
    };
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminBaz', _name: 'Baz', location: center },
      { publish: true }
    );

    if (expectOkResult(createResult)) {
      const { id: fooId } = createResult.value;
      const searchResult = await EntityAdmin.searchEntities(context, { boundingBox });
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
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminBaz', _name: 'Baz', location: outside },
      { publish: true }
    );

    if (expectOkResult(createResult)) {
      const { id: fooId } = createResult.value;
      const searchResult = await EntityAdmin.searchEntities(context, { boundingBox });
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

    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminBaz', _name: 'Baz', locations: [center, inside] },
      { publish: true }
    );

    if (expectOkResult(createResult)) {
      const { id: fooId } = createResult.value;
      const searchResult = await EntityAdmin.searchEntities(context, { boundingBox });
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
});

describe('getTotalCount', () => {
  test('Check that we get the correct count', async () => {
    const result = await EntityAdmin.getTotalCount(context, {
      entityTypes: ['AdminOnlyEditBefore'],
    });
    if (expectOkResult(result)) {
      expect(result.value).toBe(entitiesOfTypeAdminOnlyEditBefore.length);
    }
  });

  test('Query based on referencing, one reference', async () => {
    const { barId } = await createBarWithFooBazReferences(context, 1, 0);

    const result = await EntityAdmin.getTotalCount(context, { referencing: barId });
    if (expectOkResult(result)) {
      expect(result.value).toBe(1);
    }
  });

  test('Query based on referencing, no references', async () => {
    const { barId } = await createBarWithFooBazReferences(context, 0, 0);

    const result = await EntityAdmin.getTotalCount(context, { referencing: barId });
    if (expectOkResult(result)) {
      expect(result.value).toBe(0);
    }
  });

  test('Query based on referencing and entityTypes, one reference', async () => {
    const { barId } = await createBarWithFooBazReferences(context, 1, 1);

    const result = await EntityAdmin.getTotalCount(context, {
      entityTypes: ['EntityAdminBaz'],
      referencing: barId,
    });
    if (expectOkResult(result)) {
      expect(result.value).toBe(1);
    }
  });

  test('Query based on referencing, two references from one entity', async () => {
    const { barId } = await createBarWithFooBazReferences(context, 0, 1, 2);

    const result = await EntityAdmin.getTotalCount(context, { referencing: barId });
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

    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminBaz', _name: 'Baz', locations: [center, inside] },
      { publish: true }
    );

    if (expectOkResult(createResult)) {
      const searchResult = await EntityAdmin.searchEntities(context, { boundingBox });

      const totalResult = await EntityAdmin.getTotalCount(context, { boundingBox });
      if (expectOkResult(searchResult) && expectOkResult(totalResult)) {
        // Hopefully there aren't too many entities in the bounding box
        expect(searchResult.value?.pageInfo.hasNextPage).toBeFalsy();

        expect(totalResult.value).toBe(searchResult.value?.edges.length);
      }
    }
  });
});

describe('updateEntity()', () => {
  test('Update EntityAdminFoo and publish', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminFoo', _name: 'Original', title: 'Original' },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;
      let name = createResult.value._name;

      const updateResult = await EntityAdmin.updateEntity(
        context,
        { id, _type: 'EntityAdminFoo', _name: 'Updated name', title: 'Updated title' },
        { publish: true }
      );
      if (expectOkResult(updateResult)) {
        name = updateResult.value._name;
        expect(name).toMatch(/^Updated name(#[0-9]+)?$/);

        expect(updateResult.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: name,
          _version: 1,
          title: 'Updated title',
        });
      }

      const historyResult = await EntityAdmin.getEntityHistory(context, id);
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            deleted: false,
            published: false,
            createdBy: context.session.subjectId,
          },
          {
            version: 1,
            deleted: false,
            published: true,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await EntityAdmin.getEntity(context, id, 0);
      if (expectOkResult(version0Result)) {
        expect(version0Result.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: name, // original name isn't kept
          _version: 0,
          title: 'Original',
        });
      }

      const version1Result = await EntityAdmin.getEntity(context, id, 1);
      if (expectOkResult(version1Result)) {
        expect(version1Result.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: name,
          _version: 1,
          title: 'Updated title',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: name,
          title: 'Updated title',
        });
      }
    }
  });

  test('Update EntityAdminFoo w/o publish', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminFoo', _name: 'First', title: 'First' },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;
      let name = createResult.value._name;

      const updateResult = await EntityAdmin.updateEntity(
        context,
        { id, _type: 'EntityAdminFoo', _name: 'Updated name', title: 'Updated title' },
        { publish: false }
      );
      if (expectOkResult(updateResult)) {
        name = updateResult.value._name;
        expect(name).toMatch(/^Updated name(#[0-9]+)?$/);

        expect(updateResult.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: name,
          _version: 1,
          title: 'Updated title',
        });
      }

      const historyResult = await EntityAdmin.getEntityHistory(context, id);
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            deleted: false,
            published: true,
            createdBy: context.session.subjectId,
          },
          {
            version: 1,
            deleted: false,
            published: false,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await EntityAdmin.getEntity(context, id, 0);
      if (expectOkResult(version0Result)) {
        expect(version0Result.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: name,
          _version: 0,
          title: 'First',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, 1);
      if (expectOkResult(version1Result)) {
        expect(version1Result.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: name,
          _version: 1,
          title: 'Updated title',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: name,
          title: 'First',
        });
      }
    }
  });

  test('Update EntityAdminFoo w/o type and name', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminFoo', _name: 'Original', title: 'Original' },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      const updateResult = await EntityAdmin.updateEntity(
        context,
        { id, title: 'Updated title' },
        { publish: true }
      );
      if (expectOkResult(updateResult)) {
        expect(updateResult.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 1,
          title: 'Updated title',
        });
      }

      const historyResult = await EntityAdmin.getEntityHistory(context, id);
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            deleted: false,
            published: false,
            createdBy: context.session.subjectId,
          },
          {
            version: 1,
            deleted: false,
            published: true,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await EntityAdmin.getEntity(context, id, 0);
      if (expectOkResult(version0Result)) {
        expect(version0Result.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 0,
          title: 'Original',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, 1);
      if (expectOkResult(version1Result)) {
        expect(version1Result.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 1,
          title: 'Updated title',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          title: 'Updated title',
        });
      }
    }
  });

  test('Update EntityAdminFoo w/o providing all fields', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminFoo',
        _name: 'First name',
        title: 'First title',
        summary: 'First summary',
      },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      const updateResult = await EntityAdmin.updateEntity(
        context,
        { id, summary: 'Updated summary' },
        { publish: true }
      );
      if (expectOkResult(updateResult)) {
        expect(updateResult.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 1,
          title: 'First title',
          summary: 'Updated summary',
        });
      }

      const historyResult = await EntityAdmin.getEntityHistory(context, id);
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            deleted: false,
            published: false,
            createdBy: context.session.subjectId,
          },
          {
            version: 1,
            deleted: false,
            published: true,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await EntityAdmin.getEntity(context, id, 0);
      if (expectOkResult(version0Result)) {
        expect(version0Result.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 0,
          title: 'First title',
          summary: 'First summary',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, 1);
      if (expectOkResult(version1Result)) {
        expect(version1Result.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 1,
          title: 'First title',
          summary: 'Updated summary',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          title: 'First title',
          summary: 'Updated summary',
        });
      }
    }
  });

  test('Update EntityAdminFoo with the same name', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminFoo',
        _name: 'First name',
        title: 'First title',
        summary: 'First summary',
      },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id, _name: name } = createResult.value;

      const updateResult = await EntityAdmin.updateEntity(
        context,
        { id, _name: name },
        { publish: true }
      );
      if (expectOkResult(updateResult)) {
        expect(updateResult.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: name,
          _version: 1,
          title: 'First title',
          summary: 'First summary',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: name,
          title: 'First title',
          summary: 'First summary',
        });
      }
    }
  });

  test('Update EntityAdminFoo with reference', async () => {
    const createFooResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminFoo',
        _name: 'First name',
        title: 'First title',
        summary: 'First summary',
      },
      { publish: true }
    );
    if (expectOkResult(createFooResult)) {
      const { id: fooId } = createFooResult.value;

      const createBarResult = await EntityAdmin.createEntity(
        context,
        {
          _type: 'EntityAdminBar',
          _name: 'Bar entity',
          title: 'Bar entity',
        },
        { publish: true }
      );
      if (expectOkResult(createBarResult)) {
        const { id: barId } = createBarResult.value;

        const updateResult = await EntityAdmin.updateEntity(
          context,
          { id: fooId, bar: { id: barId } },
          { publish: true }
        );
        if (expectOkResult(updateResult)) {
          expect(updateResult.value).toEqual({
            id: fooId,
            _type: 'EntityAdminFoo',
            _name: createFooResult.value._name,
            _version: 1,
            title: 'First title',
            summary: 'First summary',
            bar: { id: barId },
          });
        }

        const version0Result = await EntityAdmin.getEntity(context, fooId, 0);
        if (expectOkResult(version0Result)) {
          expect(version0Result.value).toEqual({
            id: fooId,
            _type: 'EntityAdminFoo',
            _name: createFooResult.value._name,
            _version: 0,
            title: 'First title',
            summary: 'First summary',
          });
        }
        const version1Result = await EntityAdmin.getEntity(context, fooId, 1);
        if (expectOkResult(version1Result)) {
          expect(version1Result.value).toEqual({
            id: fooId,
            _type: 'EntityAdminFoo',
            _name: createFooResult.value._name,
            _version: 1,
            title: 'First title',
            summary: 'First summary',
            bar: { id: barId },
          });
        }

        const publishedResult = await PublishedEntity.getEntity(context, fooId);
        if (expectOkResult(publishedResult)) {
          expect(publishedResult.value).toEqual({
            id: fooId,
            _type: 'EntityAdminFoo',
            _name: createFooResult.value._name,
            title: 'First title',
            summary: 'First summary',
            bar: { id: barId },
          });
        }
      }
    }
  });

  test('Update EntityAdminFoo without changing a reference', async () => {
    const createBar1Result = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminBar',
        _name: 'Bar 1 entity',
        title: 'Bar 1 entity',
      },
      { publish: true }
    );
    const createBar2Result = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminBar',
        _name: 'Bar 2 entity',
        title: 'Bar 2 entity',
      },
      { publish: true }
    );
    if (expectOkResult(createBar1Result) && expectOkResult(createBar2Result)) {
      const { id: bar1Id } = createBar1Result.value;
      const { id: bar2Id } = createBar2Result.value;

      const createBazResult = await EntityAdmin.createEntity(
        context,
        {
          _type: 'EntityAdminBaz',
          _name: 'First name',
          title: 'First title',
          bar: { id: bar1Id },
          bars: [{ id: bar1Id }, { id: bar2Id }],
        },
        { publish: true }
      );
      if (expectOkResult(createBazResult)) {
        const { id: bazId } = createBazResult.value;

        const updateResult = await EntityAdmin.updateEntity(
          context,
          { id: bazId, title: 'Updated title' },
          { publish: true }
        );
        if (expectOkResult(updateResult)) {
          expect(updateResult.value).toEqual({
            id: bazId,
            _type: 'EntityAdminBaz',
            _name: createBazResult.value._name,
            _version: 1,
            title: 'Updated title',
            bar: { id: bar1Id },
            bars: [{ id: bar1Id }, { id: bar2Id }],
          });
        }

        const version0Result = await EntityAdmin.getEntity(context, bazId, 0);
        if (expectOkResult(version0Result)) {
          expect(version0Result.value).toEqual({
            id: bazId,
            _type: 'EntityAdminBaz',
            _name: createBazResult.value._name,
            _version: 0,
            title: 'First title',
            bar: { id: bar1Id },
            bars: [{ id: bar1Id }, { id: bar2Id }],
          });
        }
        const version1Result = await EntityAdmin.getEntity(context, bazId, 1);
        if (expectOkResult(version1Result)) {
          expect(version1Result.value).toEqual({
            id: bazId,
            _type: 'EntityAdminBaz',
            _name: createBazResult.value._name,
            _version: 1,
            title: 'Updated title',
            bar: { id: bar1Id },
            bars: [{ id: bar1Id }, { id: bar2Id }],
          });
        }

        const publishedResult = await PublishedEntity.getEntity(context, bazId);
        if (expectOkResult(publishedResult)) {
          expect(publishedResult.value).toEqual({
            id: bazId,
            _type: 'EntityAdminBaz',
            _name: createBazResult.value._name,
            title: 'Updated title',
            bar: { id: bar1Id },
            bars: [{ id: bar1Id }, { id: bar2Id }],
          });
        }
      }
    }
  });

  test('Error: Update with invalid id', async () => {
    const result = await EntityAdmin.updateEntity(
      context,
      {
        id: 'f773ac54-37db-42df-9b55-b6da8de344c3',
        _type: 'EntityAdminFoo',
        _name: 'name',
        foo: 'title',
      },
      { publish: false }
    );

    expectErrorResult(result, ErrorType.NotFound, 'No such entity');
  });

  test('Error: Update with different type', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminBar',
        _name: 'foo',
        title: 'foo',
      },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;
      const updateResult = await EntityAdmin.updateEntity(
        context,
        {
          id,
          _type: 'EntityAdminFoo',
          _name: 'name',
          foo: 'title',
        },
        { publish: true }
      );
      expectErrorResult(
        updateResult,
        ErrorType.BadRequest,
        'New type EntityAdminFoo doesn’t correspond to previous type EntityAdminBar'
      );
    }
  });

  test('Error: Update with invalid field', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminFoo',
        _name: 'Foo name',
        title: 'Foo title',
      },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;
      const updateResult = await EntityAdmin.updateEntity(
        context,
        { id, invalid: 'hello' },
        { publish: false }
      );

      expectErrorResult(updateResult, ErrorType.BadRequest, 'Unsupported field names: invalid');
    }
  });

  test('Error: Update EntityAdminFoo with reference to missing entity', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminFoo',
        _name: 'Foo name',
        title: 'Foo title',
      },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;
      const updateResult = await EntityAdmin.updateEntity(
        context,
        { id, bar: { id: '9783ca4f-f5b4-4f6a-a7bf-aae33e227841' } },
        { publish: true }
      );

      expectErrorResult(
        updateResult,
        ErrorType.BadRequest,
        'entity.bar: referenced entity (9783ca4f-f5b4-4f6a-a7bf-aae33e227841) doesn’t exist'
      );
    }
  });

  test('Error: Update EntityAdminFoo with reference to wrong entity type', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'EntityAdminFoo',
        _name: 'Foo name',
        title: 'Foo title',
      },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;
      const referenceId = entitiesOfTypeAdminOnlyEditBefore[0].id;

      const updateResult = await EntityAdmin.updateEntity(
        context,
        { id, bar: { id: referenceId } },
        { publish: true }
      );
      expectErrorResult(
        updateResult,
        ErrorType.BadRequest,
        `entity.bar: referenced entity (${referenceId}) has an invalid type AdminOnlyEditBefore`
      );
    }
  });
});

describe('deleteEntity()', () => {
  test('Delete & publish published EntityAdminFoo', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminFoo', _name: 'Delete', title: 'Delete' },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;
      const deleteResult = await EntityAdmin.deleteEntity(context, id, { publish: true });
      if (expectOkResult(deleteResult)) {
        expect(deleteResult.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 1,
          _deleted: true,
        });
      }

      const historyResult = await EntityAdmin.getEntityHistory(context, createResult.value.id);
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            deleted: false,
            published: false,
            createdBy: context.session.subjectId,
          },
          {
            version: 1,
            deleted: true,
            published: true,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await EntityAdmin.getEntity(context, id, 0);
      if (expectOkResult(version0Result)) {
        expect(version0Result.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 0,
          title: 'Delete',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, 1);
      if (expectOkResult(version1Result)) {
        expect(version1Result.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 1,
          _deleted: true,
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      expectErrorResult(publishedResult, ErrorType.NotFound, 'No such entity');
    }
  });

  test('Delete & publish never published EntityAdminFoo', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminFoo', _name: 'Draft', title: 'Draft' },
      { publish: false }
    );
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;
      const deleteResult = await EntityAdmin.deleteEntity(context, id, { publish: true });
      if (expectOkResult(deleteResult)) {
        expect(deleteResult.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 1,
          _deleted: true,
        });
      }

      const historyResult = await EntityAdmin.getEntityHistory(context, createResult.value.id);
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            deleted: false,
            published: false,
            createdBy: context.session.subjectId,
          },
          {
            version: 1,
            deleted: true,
            published: true,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await EntityAdmin.getEntity(context, id, 0);
      if (expectOkResult(version0Result)) {
        expect(version0Result.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 0,
          title: 'Draft',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, 1);
      if (expectOkResult(version1Result)) {
        expect(version1Result.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 1,
          _deleted: true,
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      expectErrorResult(publishedResult, ErrorType.NotFound, 'No such entity');
    }
  });

  test('Delete w/o publish published EntityAdminFoo', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminFoo', _name: 'Delete', title: 'Delete' },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;
      const deleteResult = await EntityAdmin.deleteEntity(context, id, { publish: false });
      if (expectOkResult(deleteResult)) {
        expect(deleteResult.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 1,
          _deleted: true,
        });
      }

      const historyResult = await EntityAdmin.getEntityHistory(context, createResult.value.id);
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            deleted: false,
            published: true,
            createdBy: context.session.subjectId,
          },
          {
            version: 1,
            deleted: true,
            published: false,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await EntityAdmin.getEntity(context, id, 0);
      if (expectOkResult(version0Result)) {
        expect(version0Result.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 0,
          title: 'Delete',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, 1);
      if (expectOkResult(version1Result)) {
        expect(version1Result.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 1,
          _deleted: true,
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          title: 'Delete',
        });
      }
    }
  });

  test('Delete w/o publish never published EntityAdminFoo', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminFoo', _name: 'Draft', title: 'Draft' },
      { publish: false }
    );
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;
      const deleteResult = await EntityAdmin.deleteEntity(context, id, { publish: false });
      if (expectOkResult(deleteResult)) {
        expect(deleteResult.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 1,
          _deleted: true,
        });
      }

      const historyResult = await EntityAdmin.getEntityHistory(context, createResult.value.id);
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            deleted: false,
            published: false,
            createdBy: context.session.subjectId,
          },
          {
            version: 1,
            deleted: true,
            published: false,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await EntityAdmin.getEntity(context, id, 0);
      if (expectOkResult(version0Result)) {
        expect(version0Result.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 0,
          title: 'Draft',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, 1);
      if (expectOkResult(version1Result)) {
        expect(version1Result.value).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 1,
          _deleted: true,
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      expectErrorResult(publishedResult, ErrorType.NotFound, 'No such entity');
    }
  });

  test('Error: Delete with invalid id', async () => {
    const result = await EntityAdmin.deleteEntity(context, '6746350e-b38a-48ed-a8b3-9c81ca5f9d7b', {
      publish: true,
    });
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
