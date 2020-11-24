import type {
  AdminEntity,
  AdminFilter,
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

beforeAll(async () => {
  instance = await createTestInstance({ loadSchema: true });
  context = await ensureSessionContext(instance, 'test', 'entity-admin');
  await updateSchema(context, {
    EntityAdminFoo: {
      fields: [
        { name: 'title', type: EntityFieldType.String, isName: true },
        { name: 'summary', type: EntityFieldType.String },
        { name: 'bar', type: EntityFieldType.Reference },
      ],
    },
    EntityAdminBar: { fields: [{ name: 'title', type: EntityFieldType.String }] },
    AdminOnlyEditBefore: { fields: [{ name: 'message', type: EntityFieldType.String }] },
  });

  entitiesOfTypeAdminOnlyEditBefore = await ensureEntitiesExistForAdminOnlyEditBefore(context);
});
afterAll(async () => {
  await instance.shutdown();
});

async function ensureEntitiesExistForAdminOnlyEditBefore(context: SessionContext) {
  const requestedCount = 50;
  const entitiesOfType: AdminEntity[] = [];
  // TODO add total count to AdminEntity instead
  await visitAllEntityPages(
    context,
    { entityTypes: ['AdminOnlyEditBefore'] },
    { first: 100 },
    (connection) => {
      for (const edge of connection.edges) {
        if (edge.node.isOk()) {
          entitiesOfType.push(edge.node.value);
        }
      }
    }
  );

  while (entitiesOfType.length < requestedCount) {
    const random = String(Math.random()).slice(2);
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'AdminOnlyEditBefore', _name: random, message: `Hey ${random}` },
      { publish: true }
    );
    if (createResult.isError()) {
      throw createResult.toError();
    }
    const getResult = await EntityAdmin.getEntity(context, createResult.value.id, {});
    getResult.throwIfError();
    if (getResult.isOk()) {
      entitiesOfType.push(getResult.value.item);
    }
  }
  return entitiesOfType;
}

async function visitAllEntityPages(
  context: SessionContext,
  filter: AdminFilter,
  paging: Paging,
  visitor: (connection: Connection<Edge<AdminEntity, ErrorType>>) => void
) {
  const ownPaging = { ...paging };
  const isForwards = isPagingForwards(ownPaging);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await EntityAdmin.searchEntities(context, filter, ownPaging);
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
          _name: 'Foo',
          // No title since deleted
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
      expect(createResult.value.id).toMatch(uuidMatcher);
      const { id } = createResult.value;

      const historyResult = await EntityAdmin.getEntityHistory(context, id);
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            isDelete: false,
            isPublished: true,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await EntityAdmin.getEntity(context, id, { version: 0 });
      if (expectOkResult(version0Result)) {
        expect(version0Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'Foo',
          title: 'Title',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'Foo',
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

      const historyResult = await EntityAdmin.getEntityHistory(context, id);
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            isDelete: false,
            isPublished: false,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await EntityAdmin.getEntity(context, id, { version: 0 });
      if (expectOkResult(version0Result)) {
        expect(version0Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'Draft',
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

        const fooVersion0Result = await EntityAdmin.getEntity(context, fooId, { version: 0 });
        if (expectOkResult(fooVersion0Result)) {
          expect(fooVersion0Result.value.item).toEqual({
            id: fooId,
            _type: 'EntityAdminFoo',
            _name: 'Foo name',
            title: 'Foo title',
            bar: { id: barId },
          });
        }

        const publishedFooResult = await PublishedEntity.getEntity(context, fooId);
        if (expectOkResult(publishedFooResult)) {
          expect(publishedFooResult.value.item).toEqual({
            id: fooId,
            _type: 'EntityAdminFoo',
            _name: 'Foo name',
            title: 'Foo title',
            bar: { id: barId },
          });
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
});

function expectConnectionToMatchSlice(
  connection: Connection<Edge<AdminEntity, ErrorType>> | null,
  sliceStart: number,
  sliceEnd?: number
) {
  const actualIds = connection?.edges.map((edge) => ({
    id: edge.node.isOk() ? edge.node.value.id : edge.node,
  }));

  const expectedIds = entitiesOfTypeAdminOnlyEditBefore
    .slice(sliceStart, sliceEnd)
    .map((x) => ({ id: x.id }));

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

  test('Last', async () => {
    const result = await EntityAdmin.searchEntities(
      context,
      {
        entityTypes: ['AdminOnlyEditBefore'],
      },
      { last: 10 }
    );
    if (expectOkResult(result)) {
      expectConnectionToMatchSlice(result.value, -10);
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

      const updateResult = await EntityAdmin.updateEntity(
        context,
        { id, _type: 'EntityAdminFoo', _name: 'Updated name', title: 'Updated title' },
        { publish: true }
      );
      expectOkResult(updateResult);

      const historyResult = await EntityAdmin.getEntityHistory(context, id);
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            isDelete: false,
            isPublished: false,
            createdBy: context.session.subjectId,
          },
          {
            version: 1,
            isDelete: false,
            isPublished: true,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await EntityAdmin.getEntity(context, id, { version: 0 });
      if (expectOkResult(version0Result)) {
        expect(version0Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'Updated name', // original name isn't kept
          title: 'Original',
        });
      }

      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'Updated name',
          title: 'Updated title',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'Updated name',
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

      const updateResult = await EntityAdmin.updateEntity(
        context,
        { id, _type: 'EntityAdminFoo', _name: 'Updated name', title: 'Updated title' },
        { publish: false }
      );
      expectOkResult(updateResult);

      const historyResult = await EntityAdmin.getEntityHistory(context, id);
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            isDelete: false,
            isPublished: true,
            createdBy: context.session.subjectId,
          },
          {
            version: 1,
            isDelete: false,
            isPublished: false,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await EntityAdmin.getEntity(context, id, { version: 0 });
      if (expectOkResult(version0Result)) {
        expect(version0Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'Updated name',
          title: 'First',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'Updated name',
          title: 'Updated title',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'Updated name',
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
      expectOkResult(updateResult);

      const historyResult = await EntityAdmin.getEntityHistory(context, id);
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            isDelete: false,
            isPublished: false,
            createdBy: context.session.subjectId,
          },
          {
            version: 1,
            isDelete: false,
            isPublished: true,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await EntityAdmin.getEntity(context, id, { version: 0 });
      if (expectOkResult(version0Result)) {
        expect(version0Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'Original',
          title: 'Original',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'Original',
          title: 'Updated title',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'Original',
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
      expectOkResult(updateResult);

      const historyResult = await EntityAdmin.getEntityHistory(context, id);
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            isDelete: false,
            isPublished: false,
            createdBy: context.session.subjectId,
          },
          {
            version: 1,
            isDelete: false,
            isPublished: true,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await EntityAdmin.getEntity(context, id, { version: 0 });
      if (expectOkResult(version0Result)) {
        expect(version0Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'First name',
          title: 'First title',
          summary: 'First summary',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'First name',
          title: 'First title',
          summary: 'Updated summary',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'First name',
          title: 'First title',
          summary: 'Updated summary',
        });
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
      expectOkResult(deleteResult);

      const historyResult = await EntityAdmin.getEntityHistory(context, createResult.value.id);
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            isDelete: false,
            isPublished: false,
            createdBy: context.session.subjectId,
          },
          {
            version: 1,
            isDelete: true,
            isPublished: true,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await EntityAdmin.getEntity(context, id, { version: 0 });
      if (expectOkResult(version0Result)) {
        expect(version0Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'Delete',
          title: 'Delete',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'Delete',
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
      expectOkResult(deleteResult);

      const historyResult = await EntityAdmin.getEntityHistory(context, createResult.value.id);
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            isDelete: false,
            isPublished: false,
            createdBy: context.session.subjectId,
          },
          {
            version: 1,
            isDelete: true,
            isPublished: true,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await EntityAdmin.getEntity(context, id, { version: 0 });
      if (expectOkResult(version0Result)) {
        expect(version0Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'Draft',
          title: 'Draft',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'Draft',
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
      expectOkResult(deleteResult);

      const historyResult = await EntityAdmin.getEntityHistory(context, createResult.value.id);
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            isDelete: false,
            isPublished: true,
            createdBy: context.session.subjectId,
          },
          {
            version: 1,
            isDelete: true,
            isPublished: false,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await EntityAdmin.getEntity(context, id, { version: 0 });
      if (expectOkResult(version0Result)) {
        expect(version0Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'Delete',
          title: 'Delete',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'Delete',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'Delete',
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
      expectOkResult(deleteResult);

      const historyResult = await EntityAdmin.getEntityHistory(context, createResult.value.id);
      if (expectOkResult(historyResult)) {
        expectEntityHistoryVersions(historyResult.value, [
          {
            version: 0,
            isDelete: false,
            isPublished: false,
            createdBy: context.session.subjectId,
          },
          {
            version: 1,
            isDelete: true,
            isPublished: false,
            createdBy: context.session.subjectId,
          },
        ]);
      }

      const version0Result = await EntityAdmin.getEntity(context, id, { version: 0 });
      if (expectOkResult(version0Result)) {
        expect(version0Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'Draft',
          title: 'Draft',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
          id,
          _type: 'EntityAdminFoo',
          _name: 'Draft',
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
