import { describe, expect, test } from 'vitest';
import {
  buildUrlWithUrlQuery,
  decodeObjectFromURLSearchParams,
  decodeUrlQueryStringifiedParam,
  encodeObjectToURLSearchParams,
  stringifyUrlQueryParams,
} from './UrlQueryUtils.js';

interface TestQueryParams {
  foo: string;
  bar?: string;
  baz?: string;
}

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
      encodeObjectToURLSearchParams({ foo: {} }, { keepEmptyObjects: true }).toString()
    ).toEqual('foo=%7B%7D');
  });

  test('deep value', () => {
    const actual = encodeObjectToURLSearchParams({ foo: { bar: { baz: 'hello' } } });
    expect(actual.toString()).toEqual('foo=' + encodeURIComponent('{"bar":{"baz":"hello"}}'));
  });
});

describe('decodeObjectFromURLSearchParams', () => {
  test('undefined', () => {
    expect(decodeObjectFromURLSearchParams(undefined)).toEqual({});
  });

  test('empty', () => {
    expect(decodeObjectFromURLSearchParams(new URLSearchParams())).toEqual({});
  });
});

describe('encodeObjectToURLSearchParams -> decodeObjectFromURLSearchParams', () => {
  const roundtrip = (params: Record<string, unknown> | undefined) =>
    decodeObjectFromURLSearchParams(encodeObjectToURLSearchParams(params));

  test('string', () => {
    expect(roundtrip({ foo: 'hello' })).toEqual({ foo: 'hello' });
  });

  test('number', () => {
    expect(roundtrip({ foo: 123 })).toEqual({ foo: 123 });
  });

  test('deep value', () => {
    expect(roundtrip({ foo: { bar: { baz: 'hello' } } })).toEqual({
      foo: { bar: { baz: 'hello' } },
    });
  });
});

describe('stringifyUrlQueryParams', () => {
  test('empty', () => {
    expect(stringifyUrlQueryParams({})).toEqual({});
  });

  test('null value', () => {
    expect(stringifyUrlQueryParams({ foo: null })).toEqual({});
  });

  test('undefined value', () => {
    expect(stringifyUrlQueryParams({ foo: undefined })).toEqual({});
  });

  test('empty object value', () => {
    expect(stringifyUrlQueryParams({ foo: {} })).toEqual({});
  });

  test('empty object value with keepEmptyObjects', () => {
    expect(stringifyUrlQueryParams({ foo: {} }, { keepEmptyObjects: true })).toEqual({ foo: '{}' });
  });

  test('deep value', () => {
    const actual = stringifyUrlQueryParams({ foo: { bar: { baz: 'hello' } } });
    expect(actual).toEqual({ foo: '{"bar":{"baz":"hello"}}' });
  });
});

describe('buildUrlWithUrlQuery', () => {
  test('no params', () => {
    expect(buildUrlWithUrlQuery('http://example.com', {})).toBe('http://example.com');
  });

  test('interface with ?string values', () => {
    const params: TestQueryParams = { foo: 'one', baz: 'two' };
    expect(buildUrlWithUrlQuery('http://example.com', params)).toBe(
      'http://example.com?foo=one&baz=two'
    );
  });

  test('deep value', () => {
    expect(
      buildUrlWithUrlQuery(
        'http://example.com',
        stringifyUrlQueryParams({ foo: { bar: { baz: 'hello' } } })
      )
    ).toBe('http://example.com?foo=%7B%22bar%22%3A%7B%22baz%22%3A%22hello%22%7D%7D');
  });
});

describe('decodeUrlQueryStringifiedParam', () => {
  test('deep value', () => {
    const actual: { bar: { baz: string } } | undefined = decodeUrlQueryStringifiedParam('foo', {
      foo: '{"bar":{"baz":"hello"}}',
    });
    expect(actual).toEqual({
      bar: { baz: 'hello' },
    });
  });
});
