import { ErrorType } from '@jonasb/datadata-core';
import { expectErrorResult } from '@jonasb/datadata-core-jest';
import { createMockAdapter } from '../test/TestUtils';
import { toOpaqueCursor } from './OpaqueCursor';
import { resolvePaging } from './Paging';

describe('resolvePaging()', () => {
  test('undefined', () => {
    const databaseAdapter = createMockAdapter();
    expect(resolvePaging(databaseAdapter, 'int')).toMatchInlineSnapshot(`
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
    const databaseAdapter = createMockAdapter();
    expect(resolvePaging(databaseAdapter, 'int', { first: 10 })).toMatchInlineSnapshot(`
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
    expect(
      resolvePaging(databaseAdapter, 'int', { after: toOpaqueCursor(databaseAdapter, 'int', 999) })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": 999,
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
      resolvePaging(databaseAdapter, 'int', {
        first: 10,
        after: toOpaqueCursor(databaseAdapter, 'int', 999),
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": 999,
          "before": null,
          "count": 10,
          "forwards": true,
        },
      }
    `);
  });

  test('last', () => {
    const databaseAdapter = createMockAdapter();
    expect(resolvePaging(databaseAdapter, 'int', { last: 10 })).toMatchInlineSnapshot(`
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
    expect(
      resolvePaging(databaseAdapter, 'int', { before: toOpaqueCursor(databaseAdapter, 'int', 999) })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": null,
          "before": 999,
          "count": 25,
          "forwards": true,
        },
      }
    `);
  });

  test('last,before', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      resolvePaging(databaseAdapter, 'int', {
        last: 10,
        before: toOpaqueCursor(databaseAdapter, 'int', 999),
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": null,
          "before": 999,
          "count": 10,
          "forwards": false,
        },
      }
    `);
  });

  test('last, rest undefined', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      resolvePaging(databaseAdapter, 'int', {
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
      resolvePaging(databaseAdapter, 'int', {
        after: toOpaqueCursor(databaseAdapter, 'int', 111),
        before: toOpaqueCursor(databaseAdapter, 'int', 222),
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": 111,
          "before": 222,
          "count": 25,
          "forwards": true,
        },
      }
    `);
  });

  test('first,after,before', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      resolvePaging(databaseAdapter, 'int', {
        first: 10,
        after: toOpaqueCursor(databaseAdapter, 'int', 111),
        before: toOpaqueCursor(databaseAdapter, 'int', 222),
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": 111,
          "before": 222,
          "count": 10,
          "forwards": true,
        },
      }
    `);
  });

  test('last,after,before', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      resolvePaging(databaseAdapter, 'int', {
        last: 10,
        after: toOpaqueCursor(databaseAdapter, 'int', 111),
        before: toOpaqueCursor(databaseAdapter, 'int', 222),
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": 111,
          "before": 222,
          "count": 10,
          "forwards": false,
        },
      }
    `);
  });

  test('Error: negative first', () => {
    const databaseAdapter = createMockAdapter();
    expectErrorResult(
      resolvePaging(databaseAdapter, 'int', { first: -10 }),
      ErrorType.BadRequest,
      'Paging first is a negative value'
    );
  });

  test('Error: negative last', () => {
    const databaseAdapter = createMockAdapter();
    expectErrorResult(
      resolvePaging(databaseAdapter, 'int', { last: -10 }),
      ErrorType.BadRequest,
      'Paging last is a negative value'
    );
  });

  test('Error: first,last', () => {
    const databaseAdapter = createMockAdapter();
    expectErrorResult(
      resolvePaging(databaseAdapter, 'int', { first: 10, last: 10 }),
      ErrorType.BadRequest,
      'Both first and last are defined for paging, which is not supported'
    );
  });
});
