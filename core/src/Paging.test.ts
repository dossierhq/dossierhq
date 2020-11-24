import { toOpaqueCursor } from './Connection';
import { ErrorType } from './ErrorResult';
import { resolvePaging } from './Paging';
import { expectErrorResult } from './TestUtils';

describe('resolvePaging()', () => {
  test('undefined', () =>
    expect(resolvePaging()).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": null,
          "before": null,
          "count": 25,
          "isForwards": true,
        },
      }
    `));

  test('first', () =>
    expect(resolvePaging({ first: 10 })).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": null,
          "before": null,
          "count": 10,
          "isForwards": true,
        },
      }
    `));

  test('after', () =>
    expect(resolvePaging({ after: toOpaqueCursor(999) })).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": 999,
          "before": null,
          "count": 25,
          "isForwards": true,
        },
      }
    `));

  test('first,after', () =>
    expect(resolvePaging({ first: 10, after: toOpaqueCursor(999) })).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": 999,
          "before": null,
          "count": 10,
          "isForwards": true,
        },
      }
    `));

  test('last', () =>
    expect(resolvePaging({ last: 10 })).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": null,
          "before": null,
          "count": 10,
          "isForwards": false,
        },
      }
    `));

  test('before', () =>
    expect(resolvePaging({ before: toOpaqueCursor(999) })).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": null,
          "before": 999,
          "count": 25,
          "isForwards": true,
        },
      }
    `));

  test('last,before', () =>
    expect(resolvePaging({ last: 10, before: toOpaqueCursor(999) })).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": null,
          "before": 999,
          "count": 10,
          "isForwards": false,
        },
      }
    `));

  test('last, rest undefined', () =>
    expect(resolvePaging({ first: undefined, after: undefined, last: 1, before: undefined }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": null,
          "before": null,
          "count": 1,
          "isForwards": false,
        },
      }
    `));

  test('after,before', () =>
    expect(resolvePaging({ after: toOpaqueCursor(111), before: toOpaqueCursor(222) }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": 111,
          "before": 222,
          "count": 25,
          "isForwards": true,
        },
      }
    `));

  test('first,after,before', () =>
    expect(resolvePaging({ first: 10, after: toOpaqueCursor(111), before: toOpaqueCursor(222) }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": 111,
          "before": 222,
          "count": 10,
          "isForwards": true,
        },
      }
    `));

  test('last,after,before', () =>
    expect(resolvePaging({ last: 10, after: toOpaqueCursor(111), before: toOpaqueCursor(222) }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "after": 111,
          "before": 222,
          "count": 10,
          "isForwards": false,
        },
      }
    `));

  test('Error: negative first', () =>
    expectErrorResult(
      resolvePaging({ first: -10 }),
      ErrorType.BadRequest,
      'Paging first is a negative value'
    ));

  test('Error: negative last', () =>
    expectErrorResult(
      resolvePaging({ last: -10 }),
      ErrorType.BadRequest,
      'Paging last is a negative value'
    ));

  test('Error: first,last', () =>
    expectErrorResult(
      resolvePaging({ first: 10, last: 10 }),
      ErrorType.BadRequest,
      'Both first and last are defined for paging, which is not supported'
    ));
});
