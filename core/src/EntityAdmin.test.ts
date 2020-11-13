import type { Instance, SessionContext } from '.';
import { EntityAdmin, ErrorType, PublishedEntity } from '.';
import TestInstance from '../test/TestInstance';
import {
  ensureSessionContext,
  expectErrorResult,
  expectOkResult,
  uuidMatcher,
} from '../test/TestUtils';

let instance: Instance;
let context: SessionContext;

beforeAll(async () => {
  instance = await TestInstance.createInstance({ loadSchema: true });
  context = await ensureSessionContext(instance, 'test', 'entity-admin');
});
afterAll(async () => {
  await instance.shutdown();
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

      const fetchResult = await PublishedEntity.getEntity(context, createResult.value.id);
      if (expectOkResult(fetchResult)) {
        const { id, ...entityExceptId } = fetchResult.value.item;
        expect(id).toMatch(uuidMatcher);
        expect(entityExceptId).toEqual({ _type: 'BlogPost', _name: 'Foo', title: 'Title' });
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

      const fetchResult = await PublishedEntity.getEntity(context, createResult.value.id);
      expectErrorResult(fetchResult, ErrorType.NotFound, 'No such entity');
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
      if (expectOkResult(deleteResult)) {
        const fetchResult = await PublishedEntity.getEntity(context, id);
        expectErrorResult(fetchResult, ErrorType.NotFound, 'No such entity');
      }
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
      if (expectOkResult(deleteResult)) {
        const fetchResult = await PublishedEntity.getEntity(context, id);
        expectErrorResult(fetchResult, ErrorType.NotFound, 'No such entity');
      }
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
      if (expectOkResult(deleteResult)) {
        const fetchResult = await PublishedEntity.getEntity(context, id);
        if (expectOkResult(fetchResult)) {
          const { id: fetchId, ...entityExceptId } = fetchResult.value.item;
          expect(fetchId).toBe(id);
          expect(entityExceptId).toEqual({ _type: 'BlogPost', _name: 'Delete', title: 'Delete' });
        }
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
      if (expectOkResult(deleteResult)) {
        const fetchResult = await PublishedEntity.getEntity(context, id);
        expectErrorResult(fetchResult, ErrorType.NotFound, 'No such entity');
      }
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
