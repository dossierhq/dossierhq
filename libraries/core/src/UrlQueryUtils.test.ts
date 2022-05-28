import { describe, expect, test } from 'vitest';
import {
  buildUrlWithUrlQuery,
  decodeUrlQueryStringifiedParam,
  stringifyUrlQueryParams,
} from './UrlQueryUtils.js';

interface TestQueryParams {
  foo: string;
  bar?: string;
  baz?: string;
}

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
