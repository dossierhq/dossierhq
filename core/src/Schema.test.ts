import { ErrorType, FieldType, Schema } from '.';
import type { Instance } from '.';
import { createTestInstance, expectErrorResult, expectOkResult } from './TestUtils';

let instance: Instance;

beforeAll(async () => {
  instance = await createTestInstance();
});
afterAll(async () => {
  await instance.shutdown();
});

describe('validate()', () => {
  test('Empty spec validates', () => {
    expectOkResult(new Schema({ entityTypes: [], valueTypes: [] }).validate());
  });

  test('Error: Invalid field type', () => {
    expectErrorResult(
      new Schema({
        entityTypes: [{ name: 'Foo', fields: [{ name: 'bar', type: 'Invalid' as FieldType }] }],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Specified type Invalid doesn’t exist'
    );
  });

  test('Error: Duplicate entity type names', () => {
    expectErrorResult(
      new Schema({
        entityTypes: [
          { name: 'Foo', fields: [] },
          { name: 'Foo', fields: [] },
        ],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo: Duplicate type name'
    );
  });

  test('Error: Duplicate entity and value type names', () => {
    expectErrorResult(
      new Schema({
        entityTypes: [{ name: 'Foo', fields: [] }],
        valueTypes: [{ name: 'Foo', fields: [] }],
      }).validate(),
      ErrorType.BadRequest,
      'Foo: Duplicate type name'
    );
  });

  test('Error: Reference to invalid entity type', () => {
    expectErrorResult(
      new Schema({
        entityTypes: [
          {
            name: 'Foo',
            fields: [{ name: 'bar', type: FieldType.EntityType, entityTypes: ['Invalid'] }],
          },
        ],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Referenced entity type in entityTypes Invalid doesn’t exist'
    );
  });

  test('Error: entityTypes specified on String field', () => {
    expectErrorResult(
      new Schema({
        entityTypes: [
          { name: 'Foo', fields: [{ name: 'bar', type: FieldType.String, entityTypes: ['Bar'] }] },
          { name: 'Bar', fields: [] },
        ],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Field with type String shouldn’t specify entityTypes'
    );
  });

  test('Error: Value type with invalid value type', () => {
    expectErrorResult(
      new Schema({
        entityTypes: [
          {
            name: 'Foo',
            fields: [{ name: 'bar', type: FieldType.ValueType, valueTypes: ['Invalid'] }],
          },
        ],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Value type in valueTypes Invalid doesn’t exist'
    );
  });

  test('Error: valueTypes specified on String field', () => {
    expectErrorResult(
      new Schema({
        entityTypes: [
          { name: 'Foo', fields: [{ name: 'bar', type: FieldType.String, valueTypes: ['Bar'] }] },
          { name: 'Bar', fields: [] },
        ],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Field with type String shouldn’t specify valueTypes'
    );
  });
});
