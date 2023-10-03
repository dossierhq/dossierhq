import { describe, expect, test } from 'vitest';
import { convertQueryParameters } from './LibSqlAdapter.js';

describe('convertQueryParameters', () => {
  test('undefined values', () => {
    expect(convertQueryParameters('SELECT * FROM table', undefined)).toEqual([
      'SELECT * FROM table',
      undefined,
    ]);
  });

  test('empty values', () => {
    expect(convertQueryParameters('SELECT * FROM table', [])).toEqual([
      'SELECT * FROM table',
      undefined,
    ]);
  });

  test('one value', () => {
    expect(convertQueryParameters('INSERT INTO table VALUES ?1', [123])).toEqual([
      'INSERT INTO table VALUES @p1',
      { p1: 123 },
    ]);
  });
});
