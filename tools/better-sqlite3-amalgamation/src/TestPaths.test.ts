import { createBetterSqlite3Adapter } from '@dossierhq/better-sqlite3';
import { createConsoleLogger } from '@dossierhq/core';
import { NoneAndSubjectAuthorizationAdapter } from '@dossierhq/server';
import { describe, expect, test } from 'vitest';

describe('@dossierhq/better-sqlite3', () => {
  test('createBetterSqlite3Adapter', () => {
    expect(typeof createBetterSqlite3Adapter).toBe('function');
  });
});

describe('@dossierhq/core', () => {
  test('createConsoleLogger', () => {
    expect(createConsoleLogger(console)).toBeTruthy();
  });
});

describe('@dossierhq/server', () => {
  test('NoneAndSubjectAuthorizationAdapter', () => {
    expect(NoneAndSubjectAuthorizationAdapter).toBeTruthy();
  });
});
