import type { Instance, SessionContext } from '.';
import { EntityAdmin, ErrorType } from '.';
import TestInstance from '../test/TestInstance';
import { ensureSessionContext, expectErrorResult, uuidMatcher } from '../test/TestUtils';

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
    const result = await EntityAdmin.createEntity(
      context,
      { _type: 'BlogPost', _name: 'Foo', title: 'Title' },
      { publish: true }
    );
    expect(result.isOk()).toBeTruthy();
    if (result.isOk()) {
      expect(result.value.id).toMatch(uuidMatcher);
    }
  });

  test('Create BlogPost w/o publish', async () => {
    const result = await EntityAdmin.createEntity(
      context,
      { _type: 'BlogPost', _name: 'Draft', title: 'Draft' },
      { publish: false }
    );
    expect(result.isOk()).toBeTruthy();
    if (result.isOk()) {
      expect(result.value.id).toMatch(uuidMatcher);
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
