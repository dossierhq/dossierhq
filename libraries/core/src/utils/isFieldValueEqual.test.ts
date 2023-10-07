import { describe, expect, test } from 'vitest';
import { isFieldValueEqual } from './isFieldValueEqual.js';

describe('isFieldValueEqual', () => {
  test('string===string', () => expect(isFieldValueEqual('hello', 'hello')).toBeTruthy());

  test('string!==null', () => expect(isFieldValueEqual('hello', null)).toBeFalsy());

  test('string!==other string', () => expect(isFieldValueEqual('hello', 'world')).toBeFalsy());

  test('string[]===string[]', () =>
    expect(isFieldValueEqual(['hello', 'world'], ['hello', 'world'])).toBeTruthy());

  test('string[]!==string[] (order)', () =>
    expect(isFieldValueEqual(['hello', 'world'], ['world', 'hello'])).toBeFalsy());

  test('component===component', () =>
    expect(
      isFieldValueEqual(
        {
          type: 'Foo',
          string: 'string',
          stringList: ['string', 'list'],
          entity: { id: 'entity-id-1' },
          entityList: [{ id: 'entity-id-1' }],
        },
        {
          type: 'Foo',
          string: 'string',
          stringList: ['string', 'list'],
          entity: { id: 'entity-id-1' },
          entityList: [{ id: 'entity-id-1' }],
        },
      ),
    ).toBeTruthy());

  test('component!==component', () =>
    expect(
      isFieldValueEqual(
        {
          type: 'Foo',
          string: 'string',
          stringList: ['string', 'list'],
          entity: { id: 'entity-id-1' },
          entityList: [{ id: 'entity-id-1' }],
        },
        {
          type: 'Foo',
          string: 'string',
          stringList: ['string', 'DIFFERENCE'],
          entity: { id: 'entity-id-1' },
          entityList: [{ id: 'entity-id-1' }],
        },
      ),
    ).toBeFalsy());
});
