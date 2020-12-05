import type {
  AdminEntity,
  AdminQuery,
  Connection,
  Edge,
  Instance,
  Paging,
  SessionContext,
} from '.';
import { isPagingForwards, EntityAdmin, EntityFieldType, ErrorType, PublishedEntity } from '.';
import {
  createTestInstance,
  ensureSessionContext,
  expectErrorResult,
  expectOkResult,
  updateSchema,
} from './TestUtils';
import { expectEntityHistoryVersions, uuidMatcher } from '../test/AdditionalTestUtils';

let instance: Instance;
let context: SessionContext;
let entitiesOfTypeAdminOnlyEditBefore: AdminEntity[];
let deletedIdsOfTypeAdminOnlyEditBefore: string[];

beforeAll(async () => {
  instance = await createTestInstance();
  context = await ensureSessionContext(instance, 'test', 'entity-admin');
  await updateSchema(context, {
    EntityAdminFoo: {
      fields: [
        { name: 'title', type: EntityFieldType.String, isName: true },
        { name: 'summary', type: EntityFieldType.String },
        { name: 'bar', type: EntityFieldType.Reference, entityTypes: ['EntityAdminBar'] },
      ],
    },
    EntityAdminBar: { fields: [{ name: 'title', type: EntityFieldType.String }] },
    EntityAdminBaz: {
      fields: [
        { name: 'title', type: EntityFieldType.String },
        { name: 'bar', type: EntityFieldType.Reference, entityTypes: ['EntityAdminBar'] },
        { name: 'tags', type: EntityFieldType.String, list: true },
        {
          name: 'bars',
          type: EntityFieldType.Reference,
          list: true,
          entityTypes: ['EntityAdminBar'],
        },
      ],
    },
    AdminOnlyEditBefore: { fields: [{ name: 'message', type: EntityFieldType.String }] },
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
  await instance.shutdown();
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
  contest: SessionContext,
  fooCount: number,
  bazCount: number
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
    const createBazResult = await EntityAdmin.createEntity(
      context,
      { _type: 'EntityAdminBaz', _name: 'Baz: ' + i, bar: { id: barId } },
      { publish: true }
    );
    if (expectOkResult(createBazResult)) {
      bazEntities.push(createBazResult.value);
    }
  }
  return { barId, fooEntities, bazEntities };
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

      const versionMaxResult = await EntityAdmin.getEntity(context, id, {});
      if (expectOkResult(versionMaxResult)) {
        expect(versionMaxResult.value.item).toEqual({
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
    const result = await EntityAdmin.getEntity(context, '13e4c7da-616e-44a3-a039-24f96f9b17da', {});
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

      const resultMinusOne = await EntityAdmin.getEntity(context, id, { version: -1 });
      expectErrorResult(resultMinusOne, ErrorType.NotFound, 'No such entity or version');

      const resultOne = await EntityAdmin.getEntity(context, id, { version: 1 });
      expectErrorResult(resultOne, ErrorType.NotFound, 'No such entity or version');
    }
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

      const version0Result = await EntityAdmin.getEntity(context, id, { version: 0 });
      if (expectOkResult(version0Result)) {
        expect(version0Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: name,
          _version: 0,
          title: 'Title',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value.item).toEqual({
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

      const version0Result = await EntityAdmin.getEntity(context, id, { version: 0 });
      if (expectOkResult(version0Result)) {
        expect(version0Result.value.item).toEqual({
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

        const fooVersion0Result = await EntityAdmin.getEntity(context, fooId, { version: 0 });
        if (expectOkResult(fooVersion0Result)) {
          expect(fooVersion0Result.value.item).toEqual({
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
          expect(publishedFooResult.value.item).toEqual({
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

      const getResult = await EntityAdmin.getEntity(context, id, {});
      if (expectOkResult(getResult)) {
        expect(getResult.value.item).toEqual({
          id,
          _type: 'EntityAdminBaz',
          _name: name,
          _version: 0,
          tags: ['one', 'two', 'three'],
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

        const getResult = await EntityAdmin.getEntity(context, id, {});
        if (expectOkResult(getResult)) {
          expect(getResult.value.item).toEqual({
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
      { _type: 'EntityAdminFoo', _name: '', foo: 'title' },
      { publish: false }
    );

    expectErrorResult(result, ErrorType.BadRequest, 'Missing entity._name');
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
      'Referenced entity (fcc46a9e-2097-4bd6-bb08-56d5f59db26b) of field bar doesn’t exist'
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
      `Referenced entity (${referenceId}) of field bar has an invalid type AdminOnlyEditBefore`
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

      const version0Result = await EntityAdmin.getEntity(context, id, { version: 0 });
      if (expectOkResult(version0Result)) {
        expect(version0Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: name, // original name isn't kept
          _version: 0,
          title: 'Original',
        });
      }

      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: name,
          _version: 1,
          title: 'Updated title',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value.item).toEqual({
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

      const version0Result = await EntityAdmin.getEntity(context, id, { version: 0 });
      if (expectOkResult(version0Result)) {
        expect(version0Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: name,
          _version: 0,
          title: 'First',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: name,
          _version: 1,
          title: 'Updated title',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value.item).toEqual({
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

      const version0Result = await EntityAdmin.getEntity(context, id, { version: 0 });
      if (expectOkResult(version0Result)) {
        expect(version0Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 0,
          title: 'Original',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 1,
          title: 'Updated title',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value.item).toEqual({
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

      const version0Result = await EntityAdmin.getEntity(context, id, { version: 0 });
      if (expectOkResult(version0Result)) {
        expect(version0Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 0,
          title: 'First title',
          summary: 'First summary',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
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
        expect(publishedResult.value.item).toEqual({
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
        expect(publishedResult.value.item).toEqual({
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

        const version0Result = await EntityAdmin.getEntity(context, fooId, { version: 0 });
        if (expectOkResult(version0Result)) {
          expect(version0Result.value.item).toEqual({
            id: fooId,
            _type: 'EntityAdminFoo',
            _name: createFooResult.value._name,
            _version: 0,
            title: 'First title',
            summary: 'First summary',
          });
        }
        const version1Result = await EntityAdmin.getEntity(context, fooId, { version: 1 });
        if (expectOkResult(version1Result)) {
          expect(version1Result.value.item).toEqual({
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
          expect(publishedResult.value.item).toEqual({
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

        const version0Result = await EntityAdmin.getEntity(context, bazId, { version: 0 });
        if (expectOkResult(version0Result)) {
          expect(version0Result.value.item).toEqual({
            id: bazId,
            _type: 'EntityAdminBaz',
            _name: createBazResult.value._name,
            _version: 0,
            title: 'First title',
            bar: { id: bar1Id },
            bars: [{ id: bar1Id }, { id: bar2Id }],
          });
        }
        const version1Result = await EntityAdmin.getEntity(context, bazId, { version: 1 });
        if (expectOkResult(version1Result)) {
          expect(version1Result.value.item).toEqual({
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
          expect(publishedResult.value.item).toEqual({
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
        'Referenced entity (9783ca4f-f5b4-4f6a-a7bf-aae33e227841) of field bar doesn’t exist'
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
        `Referenced entity (${referenceId}) of field bar has an invalid type AdminOnlyEditBefore`
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

      const version0Result = await EntityAdmin.getEntity(context, id, { version: 0 });
      if (expectOkResult(version0Result)) {
        expect(version0Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 0,
          title: 'Delete',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
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

      const version0Result = await EntityAdmin.getEntity(context, id, { version: 0 });
      if (expectOkResult(version0Result)) {
        expect(version0Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 0,
          title: 'Draft',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
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

      const version0Result = await EntityAdmin.getEntity(context, id, { version: 0 });
      if (expectOkResult(version0Result)) {
        expect(version0Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 0,
          title: 'Delete',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 1,
          _deleted: true,
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value.item).toEqual({
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

      const version0Result = await EntityAdmin.getEntity(context, id, { version: 0 });
      if (expectOkResult(version0Result)) {
        expect(version0Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: createResult.value._name,
          _version: 0,
          title: 'Draft',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
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
