import { EntityFieldType, ErrorType, Schema } from '.';
import type { Instance } from '.';
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

  test('Error: Reference to invalid entity type', () => {
    expectErrorResult(
      new Schema({
        entityTypes: {
          Foo: {
            fields: [{ name: 'bar', type: EntityFieldType.Reference, entityTypes: ['Invalid'] }],
          },
        },
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Referenced entity type in entityTypes Invalid doesn’t exist'
    );
  });

  test('Error: entityTypes specified on String field', () => {
    expectErrorResult(
      new Schema({
        entityTypes: {
          Foo: {
            fields: [{ name: 'bar', type: EntityFieldType.String, entityTypes: ['Bar'] }],
          },
          Bar: { fields: [] },
        },
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Field with type String shouldn’t specify entityTypes'
    );
  });
});
