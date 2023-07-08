import { describe, expect, test } from 'vitest';
import { decodeURLSearchParamsParam, encodeObjectToURLSearchParams } from './UrlQueryUtils.js';

describe('encodeObjectToURLSearchParams', () => {
  test('undefined', () => {
    expect(encodeObjectToURLSearchParams(undefined).toString()).toEqual('');
  });

  test('empty', () => {
    expect(encodeObjectToURLSearchParams({}).toString()).toEqual('');
  });

  test('null value', () => {
    expect(encodeObjectToURLSearchParams({ foo: null }).toString()).toEqual('');
  });

  test('undefined value', () => {
    expect(encodeObjectToURLSearchParams({ foo: undefined }).toString()).toEqual('');
  });

  test('empty object value', () => {
    expect(encodeObjectToURLSearchParams({ foo: {} }).toString()).toEqual('');
  });

  test('empty object value with keepEmptyObjects', () => {
    expect(
      encodeObjectToURLSearchParams({ foo: {} }, { keepEmptyObjects: true }).toString(),
    ).toEqual('foo=%7B%7D');
  });

  test('deep value', () => {
    const actual = encodeObjectToURLSearchParams({ foo: { bar: { baz: 'hello' } } });
    expect(actual.toString()).toEqual('foo=' + encodeURIComponent('{"bar":{"baz":"hello"}}'));
  });
});

describe('decodeURLSearchParamsParam', () => {
  const roundtrip = (params: Record<string, unknown> | undefined, key: string) =>
    decodeURLSearchParamsParam(encodeObjectToURLSearchParams(params), key);

  test('undefined', () => {
    expect(decodeURLSearchParamsParam(undefined, 'foo')).toEqual(undefined);
  });

  test('empty', () => {
    expect(decodeURLSearchParamsParam(new URLSearchParams(), 'foo')).toEqual(undefined);
  });

  test('from object', () => {
    expect(decodeURLSearchParamsParam<string>({ foo: '"bar"' }, 'foo')).toEqual('bar');
  });

  test('string', () => {
    expect(roundtrip({ foo: 'hello' }, 'foo')).toEqual('hello');
  });

  test('number', () => {
    expect(roundtrip({ foo: 123 }, 'foo')).toEqual(123);
  });

  test('deep value', () => {
    expect(roundtrip({ foo: { bar: { baz: 'hello' } } }, 'foo')).toEqual({ bar: { baz: 'hello' } });
  });
});
