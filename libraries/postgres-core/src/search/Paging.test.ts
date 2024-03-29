import { describe, expect, test } from 'vitest';
import { createMockAdapter, resolvePaging } from '../test/TestUtils.js';
import { toOpaqueCursor } from './OpaqueCursor.js';
import { resolvePagingCursors } from './Paging.js';

describe('resolvePagingCursors()', () => {
  test('undefined', () => {
    const databaseAdapter = createMockAdapter();
    expect(resolvePagingCursors(databaseAdapter, 'int', resolvePaging(undefined)))
      .toMatchInlineSnapshot(`
        OkResult {
          "value": {
            "after": null,
            "before": null,
          },
        }
      `);
  });

  test('after', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      resolvePagingCursors(
        databaseAdapter,
        'int',
        resolvePaging({
          after: toOpaqueCursor(databaseAdapter, 'int', 999),
        }),
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "after": 999,
          "before": null,
        },
      }
    `);
  });

  test('before', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      resolvePagingCursors(
        databaseAdapter,
        'int',
        resolvePaging({
          before: toOpaqueCursor(databaseAdapter, 'int', 999),
        }),
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "after": null,
          "before": 999,
        },
      }
    `);
  });

  test('after,before', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      resolvePagingCursors(
        databaseAdapter,
        'int',
        resolvePaging({
          after: toOpaqueCursor(databaseAdapter, 'int', 111),
          before: toOpaqueCursor(databaseAdapter, 'int', 222),
        }),
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "after": 111,
          "before": 222,
        },
      }
    `);
  });
});
