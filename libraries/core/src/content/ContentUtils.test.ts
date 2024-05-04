import { describe, expect, test } from 'vitest';
import type { Component, Entity, EntityCreate, RichText } from '../Types.js';
import { copyEntity, getEntityNameBase, isEntityNameAsRequested } from './ContentUtils.js';

type Foo = Entity<'Foo', FooFields, ''>;

interface FooFields {
  string: string | null;
  stringList: string[] | null;
  twoStrings: TwoStrings | null;
  richText: RichText | null;
}

type TwoStrings = Component<'TwoStrings', TwoStringsFields>;

interface TwoStringsFields {
  string1: string | null;
  string2: string | null;
}

describe('copyEntity', () => {
  test('EntityCreate with app type', () => {
    const entity: EntityCreate<Foo> = {
      info: { type: 'Foo', name: 'Name', authKey: '' },
      fields: { string: 'hello' },
    };
    const copy: EntityCreate<Foo> = copyEntity(entity, {
      fields: { stringList: ['world'] },
    });
    expect(copy).toEqual({
      info: { name: 'Name', type: 'Foo', authKey: '' },
      fields: { string: 'hello', stringList: ['world'] },
    });
  });
});

describe('getEntityNameBase', () => {
  test('name', () => {
    expect(getEntityNameBase('name')).toBe('name');
  });

  test('name#123', () => {
    expect(getEntityNameBase('name#123')).toBe('name');
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
