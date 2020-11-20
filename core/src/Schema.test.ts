import { ErrorType, Schema } from '.';
import type { EntityFieldType, Instance } from '.';
import { createTestInstance, expectErrorResult, expectOkResult } from './TestUtils';

let instance: Instance;

beforeAll(async () => {
  instance = await createTestInstance({ loadSchema: false });
});
afterAll(async () => {
  await instance.shutdown();
});

describe('Instance.reloadSchema()', () => {
  test('Load', async () => {
    await instance.reloadSchema(instance.createAuthContext());
    const schema = instance.getSchema();
    expect(schema.spec).toBeTruthy();
  });
});

describe('validate()', () => {
  test('Empty spec validates', () => {
    expectOkResult(new Schema({ entityTypes: {} }).validate());
  });

  test('Error: Invalid field type', () => {
    expectErrorResult(
      new Schema({
        entityTypes: { Foo: { fields: [{ name: 'bar', type: 'Invalid' as EntityFieldType }] } },
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Specified type Invalid doesn’t exist'
    );
  });
});
