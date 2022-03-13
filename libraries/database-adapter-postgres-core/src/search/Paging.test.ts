import { ErrorType } from '@jonasb/datadata-core';
import { expectErrorResult } from '@jonasb/datadata-core-jest';
import { createMockAdapter } from '../test/TestUtils';
import { toOpaqueCursor } from './OpaqueCursor';
import { resolvePaging, resolvePagingCursors } from './Paging';

describe('resolvePaging()', () => {
  test('undefined', () => {
    expect(resolvePaging(undefined)).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": null,
          "before": null,
          "count": 25,
          "forwards": true,
        },
      }
    `);
  });

  test('first', () => {
    expect(resolvePaging({ first: 10 })).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": null,
          "before": null,
          "count": 10,
          "forwards": true,
        },
      }
    `);
  });

  test('after', () => {
    const databaseAdapter = createMockAdapter();
    expect(resolvePaging({ after: toOpaqueCursor(databaseAdapter, 'int', 999) }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": "OTk5",
          "before": null,
          "count": 25,
          "forwards": true,
        },
      }
    `);
  });

  test('first,after', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      resolvePaging({
        first: 10,
        after: toOpaqueCursor(databaseAdapter, 'int', 999),
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": "OTk5",
          "before": null,
          "count": 10,
          "forwards": true,
        },
      }
    `);
  });

  test('last', () => {
    expect(resolvePaging({ last: 10 })).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": null,
          "before": null,
          "count": 10,
          "forwards": false,
        },
      }
    `);
  });

  test('before', () => {
    const databaseAdapter = createMockAdapter();
    expect(resolvePaging({ before: toOpaqueCursor(databaseAdapter, 'int', 999) }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": null,
          "before": "OTk5",
          "count": 25,
          "forwards": true,
        },
      }
    `);
  });

  test('last,before', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      resolvePaging({
        last: 10,
        before: toOpaqueCursor(databaseAdapter, 'int', 999),
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": null,
          "before": "OTk5",
          "count": 10,
          "forwards": false,
        },
      }
    `);
  });

  test('last, rest undefined', () => {
    expect(
      resolvePaging({
        first: undefined,
        after: undefined,
        last: 1,
        before: undefined,
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": null,
          "before": null,
          "count": 1,
          "forwards": false,
        },
      }
    `);
  });

  test('after,before', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      resolvePaging({
        after: toOpaqueCursor(databaseAdapter, 'int', 111),
        before: toOpaqueCursor(databaseAdapter, 'int', 222),
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": "MTEx",
          "before": "MjIy",
          "count": 25,
          "forwards": true,
        },
      }
    `);
  });

  test('first,after,before', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      resolvePaging({
        first: 10,
        after: toOpaqueCursor(databaseAdapter, 'int', 111),
        before: toOpaqueCursor(databaseAdapter, 'int', 222),
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": "MTEx",
          "before": "MjIy",
          "count": 10,
          "forwards": true,
        },
      }
    `);
  });

  test('last,after,before', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      resolvePaging({
        last: 10,
        after: toOpaqueCursor(databaseAdapter, 'int', 111),
        before: toOpaqueCursor(databaseAdapter, 'int', 222),
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": "MTEx",
          "before": "MjIy",
          "count": 10,
          "forwards": false,
        },
      }
    `);
  });

  test('Error: negative first', () => {
    return expectErrorResult(
      resolvePaging({ first: -10 }),
      ErrorType.BadRequest,
      'Paging first is a negative value'
    );
  });

  test('Error: negative last', () => {
    return expectErrorResult(
      resolvePaging({ last: -10 }),
      ErrorType.BadRequest,
      'Paging last is a negative value'
    );
  });

  test('Error: first,last', () => {
    expectErrorResult(
      resolvePaging({ first: 10, last: 10 }),
      ErrorType.BadRequest,
      'Both first and last are defined for paging, which is not supported'
    );
  });
});

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
