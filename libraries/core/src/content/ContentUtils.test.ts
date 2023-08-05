import { describe, expect, test } from 'vitest';
import type { AdminEntity, AdminEntityCreate, RichText, ValueItem } from '../Types.js';
import { copyEntity, isEntityNameAsRequested } from './ContentUtils.js';

type AdminFoo = AdminEntity<'Foo', AdminFooFields, 'none'>;

interface AdminFooFields {
  string: string | null;
  stringList: string[] | null;
  twoStrings: AdminTwoStrings | null;
  richText: RichText | null;
}

type AdminTwoStrings = ValueItem<'TwoStrings', AdminTwoStringsFields>;

interface AdminTwoStringsFields {
  string1: string | null;
  string2: string | null;
}

describe('copyEntity', () => {
  test('AdminEntityCreate with app type', () => {
    const entity: AdminEntityCreate<AdminFoo> = {
      info: { type: 'Foo', authKey: 'none', name: 'Name' },
      fields: { string: 'hello' },
    };
    const copy: AdminEntityCreate<AdminFoo> = copyEntity(entity, {
      fields: { stringList: ['world'] },
    });
    expect(copy).toEqual({
      info: { authKey: 'none', name: 'Name', type: 'Foo' },
      fields: { string: 'hello', stringList: ['world'] },
    });
  });
});

describe('isEntityNameAsRequested', () => {
  test('hello=hello', () => expect(isEntityNameAsRequested('hello', 'hello')).toBeTruthy());
  test('hello#123=hello', () => expect(isEntityNameAsRequested('hello#123', 'hello')).toBeTruthy());
  test('hello#123=hello#123', () =>
    expect(isEntityNameAsRequested('hello#123', 'hello#123')).toBeTruthy());

  test('hello!=world', () => expect(isEntityNameAsRequested('hello', 'world')).toBeFalsy());
  test('hello#456!=hello#123', () =>
    expect(isEntityNameAsRequested('hello#456', 'hello#123')).toBeFalsy());
});
