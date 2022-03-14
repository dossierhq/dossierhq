import { createMockAdapter } from '../test/TestUtils';
import { toOpaqueCursor } from './OpaqueCursor';
import { resolvePagingCursors } from './Paging';

describe('resolvePagingCursors()', () => {
  test('undefined/undefined', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      resolvePagingCursors(databaseAdapter, 'int', {
        forwards: true,
        count: 25,
        after: null,
        before: null,
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": null,
          "before": null,
        },
      }
    `);
  });

  test('after', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      resolvePagingCursors(databaseAdapter, 'int', {
        forwards: true,
        count: 25,
        after: toOpaqueCursor(databaseAdapter, 'int', 999),
        before: null,
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": 999,
          "before": null,
        },
      }
    `);
  });

  test('before', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      resolvePagingCursors(databaseAdapter, 'int', {
        forwards: true,
        count: 25,
        after: null,
        before: toOpaqueCursor(databaseAdapter, 'int', 999),
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": null,
          "before": 999,
        },
      }
    `);
  });

  test('after,before', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      resolvePagingCursors(databaseAdapter, 'int', {
        forwards: true,
        count: 25,
        after: toOpaqueCursor(databaseAdapter, 'int', 111),
        before: toOpaqueCursor(databaseAdapter, 'int', 222),
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": 111,
          "before": 222,
        },
      }
    `);
  });
});
