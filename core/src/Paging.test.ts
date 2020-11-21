import { toOpaqueCursor } from './Connection';
import { resolvePaging } from './Paging';

describe('resolvePaging()', () => {
  // default to first
  test('undefined => first', () =>
    expect(resolvePaging()).toEqual({ isFirst: true, count: 25, cursor: null }));

  // first as specified
  test('first => first', () =>
    expect(resolvePaging({ first: 10 })).toEqual({ isFirst: true, count: 10, cursor: null }));

  test('after => first', () =>
    expect(resolvePaging({ after: toOpaqueCursor(999) })).toEqual({
      isFirst: true,
      count: 25,
      cursor: 999,
    }));

  test('first,after => first', () =>
    expect(resolvePaging({ first: 10, after: toOpaqueCursor(999) })).toEqual({
      isFirst: true,
      count: 10,
      cursor: 999,
    }));

  // last as specified
  test('last => last', () =>
    expect(resolvePaging({ last: 10 })).toEqual({ isFirst: false, count: 10, cursor: null }));

  test('before => last', () =>
    expect(resolvePaging({ before: toOpaqueCursor(999) })).toEqual({
      isFirst: false,
      count: 25,
      cursor: 999,
    }));

  test('last,before => last', () =>
    expect(resolvePaging({ last: 10, before: toOpaqueCursor(999) })).toEqual({
      isFirst: false,
      count: 10,
      cursor: 999,
    }));

  // if both, default to first

  test('first,last => first', () =>
    expect(resolvePaging({ first: 10, last: 10 })).toEqual({
      isFirst: true,
      count: 10,
      cursor: null,
    }));

  test('after,before => first', () =>
    expect(resolvePaging({ after: toOpaqueCursor(111), before: toOpaqueCursor(222) })).toEqual({
      isFirst: true,
      count: 25,
      cursor: 111,
    }));
});
