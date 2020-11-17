import type { Instance, SessionContext } from '.';
import { EntityAdmin, EntityFieldType, ErrorType, PublishedEntity } from '.';
import TestInstance from '../test/TestInstance';
import {
  ensureSessionContext,
  expectErrorResult,
  expectEntityHistoryVersions,
  expectOkResult,
  uuidMatcher,
  updateSchema,
} from '../test/TestUtils';

let instance: Instance;
let context: SessionContext;

beforeAll(async () => {
  instance = await TestInstance.createInstance({ loadSchema: true });
  context = await ensureSessionContext(instance, 'test', 'entity-admin');
  await updateSchema(context, {
    BlogPost: {
      fields: [
        { name: 'title', type: EntityFieldType.String, isName: true },
        { name: 'summary', type: EntityFieldType.String },
      ],
    },
    Category: { fields: [{ name: 'title', type: EntityFieldType.String }] },
  });
});
afterAll(async () => {
  await instance.shutdown();
});

describe('getEntity()', () => {
  // rest is tested elsewhere

  test('No version means max version', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'BlogPost', _name: 'Foo', title: 'Title' },
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
          _type: 'BlogPost',
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
      { _type: 'BlogPost', _name: 'Foo', title: 'Title' },
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
  test('Create BlogPost and publish', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'BlogPost', _name: 'Foo', title: 'Title' },
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
          _type: 'BlogPost',
          _name: 'Foo',
          title: 'Title',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value.item).toEqual({
          id,
          _type: 'BlogPost',
          _name: 'Foo',
          title: 'Title',
        });
      }
    }
  });

  test('Create BlogPost w/o publish', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'BlogPost', _name: 'Draft', title: 'Draft' },
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
          _type: 'BlogPost',
          _name: 'Draft',
          title: 'Draft',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      expectErrorResult(publishedResult, ErrorType.NotFound, 'No such entity');
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
      { _type: 'BlogPost', _name: '', foo: 'title' },
      { publish: false }
    );

    expectErrorResult(result, ErrorType.BadRequest, 'Missing entity._name');
  });
});

describe('updateEntity()', () => {
  test('Update BlogPost and publish', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'BlogPost', _name: 'Original', title: 'Original' },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      const updateResult = await EntityAdmin.updateEntity(
        context,
        { id, _type: 'BlogPost', _name: 'Updated name', title: 'Updated title' },
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
          _type: 'BlogPost',
          _name: 'Updated name', // original name isn't kept
          title: 'Original',
        });
      }

      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
          id,
          _type: 'BlogPost',
          _name: 'Updated name',
          title: 'Updated title',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value.item).toEqual({
          id,
          _type: 'BlogPost',
          _name: 'Updated name',
          title: 'Updated title',
        });
      }
    }
  });

  test('Update BlogPost w/o publish', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'BlogPost', _name: 'First', title: 'First' },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      const updateResult = await EntityAdmin.updateEntity(
        context,
        { id, _type: 'BlogPost', _name: 'Updated name', title: 'Updated title' },
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
          _type: 'BlogPost',
          _name: 'Updated name',
          title: 'First',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
          id,
          _type: 'BlogPost',
          _name: 'Updated name',
          title: 'Updated title',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value.item).toEqual({
          id,
          _type: 'BlogPost',
          _name: 'Updated name',
          title: 'First',
        });
      }
    }
  });

  test('Update BlogPost w/o type and name', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'BlogPost', _name: 'Original', title: 'Original' },
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
          _type: 'BlogPost',
          _name: 'Original',
          title: 'Original',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
          id,
          _type: 'BlogPost',
          _name: 'Original',
          title: 'Updated title',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value.item).toEqual({
          id,
          _type: 'BlogPost',
          _name: 'Original',
          title: 'Updated title',
        });
      }
    }
  });

  test('Update BlogPost w/o providing all fields', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'BlogPost', _name: 'First name', title: 'First title', summary: 'First summary' },
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
          _type: 'BlogPost',
          _name: 'First name',
          title: 'First title',
          summary: 'First summary',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
          id,
          _type: 'BlogPost',
          _name: 'First name',
          title: 'First title',
          summary: 'Updated summary',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value.item).toEqual({
          id,
          _type: 'BlogPost',
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
        _type: 'BlogPost',
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
        _type: 'Category',
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
          _type: 'BlogPost',
          _name: 'name',
          foo: 'title',
        },
        { publish: true }
      );
      expectErrorResult(
        updateResult,
        ErrorType.BadRequest,
        'New type BlogPost doesn’t correspond to previous type Category'
      );
    }
  });
});

describe('deleteEntity()', () => {
  test('Delete & publish published BlogPost', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'BlogPost', _name: 'Delete', title: 'Delete' },
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
          _type: 'BlogPost',
          _name: 'Delete',
          title: 'Delete',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
          id,
          _type: 'BlogPost',
          _name: 'Delete',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      expectErrorResult(publishedResult, ErrorType.NotFound, 'No such entity');
    }
  });

  test('Delete & publish never published BlogPost', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'BlogPost', _name: 'Draft', title: 'Draft' },
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
          _type: 'BlogPost',
          _name: 'Draft',
          title: 'Draft',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
          id,
          _type: 'BlogPost',
          _name: 'Draft',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      expectErrorResult(publishedResult, ErrorType.NotFound, 'No such entity');
    }
  });

  test('Delete w/o publish published BlogPost', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'BlogPost', _name: 'Delete', title: 'Delete' },
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
          _type: 'BlogPost',
          _name: 'Delete',
          title: 'Delete',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
          id,
          _type: 'BlogPost',
          _name: 'Delete',
        });
      }

      const publishedResult = await PublishedEntity.getEntity(context, id);
      if (expectOkResult(publishedResult)) {
        expect(publishedResult.value.item).toEqual({
          id,
          _type: 'BlogPost',
          _name: 'Delete',
          title: 'Delete',
        });
      }
    }
  });

  test('Delete w/o publish never published BlogPost', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'BlogPost', _name: 'Draft', title: 'Draft' },
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
          _type: 'BlogPost',
          _name: 'Draft',
          title: 'Draft',
        });
      }
      const version1Result = await EntityAdmin.getEntity(context, id, { version: 1 });
      if (expectOkResult(version1Result)) {
        expect(version1Result.value.item).toEqual({
          id,
          _type: 'BlogPost',
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
