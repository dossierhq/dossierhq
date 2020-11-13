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
