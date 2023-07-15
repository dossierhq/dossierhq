import { describe, expect, test } from 'vitest';
import { expectErrorResult, expectOkResult } from './CoreTestUtils.js';
import { ErrorType, notOk, ok } from './ErrorResult.js';
import type {
  JsonConnection,
  JsonEdge,
  JsonEntityHistory,
  JsonPublishingHistory,
  JsonResult,
} from './JsonUtils.js';
import {
  convertJsonConnection,
  convertJsonEdge,
  convertJsonEntityHistory,
  convertJsonPublishingHistory,
  convertJsonResult,
} from './JsonUtils.js';
import type { Connection, Edge, EntityHistory, PublishingHistory } from './Types.js';
import { PublishingEventKind } from './Types.js';

interface CustomEdge extends Edge<{ foo: string }, ErrorType> {
  edgeProperty: string;
}

interface JsonCustomEdge extends JsonEdge<{ foo: string }, ErrorType> {
  edgeProperty: string;
}

function convertCustomJsonEdge(jsonEdge: JsonCustomEdge): CustomEdge {
  return {
    ...convertJsonEdge(jsonEdge, (node) => node),
    edgeProperty: jsonEdge.edgeProperty,
  };
}

describe('convertJsonConnection()', () => {
  test('connection with value and error', () => {
    const expected: Connection<Edge<{ foo: string }, ErrorType>> = {
      pageInfo: {
        hasPreviousPage: false,
        hasNextPage: true,
        startCursor: 'start',
        endCursor: 'end',
      },
      edges: [
        { cursor: 'one', node: ok({ foo: 'first' }) },
        { cursor: 'two', node: notOk.BadRequest('Failed') },
      ],
    };
    const asJson = JSON.parse(JSON.stringify(expected)) as JsonConnection<
      JsonEdge<{ foo: string }, ErrorType>
    >;
    const converted = convertJsonConnection(asJson, (edge) =>
      convertJsonEdge(edge, (node) => node),
    );
    expect(converted).toEqual(expected);
  });

  test('connection with custom edge type', () => {
    const expected: Connection<CustomEdge> = {
      pageInfo: {
        hasPreviousPage: false,
        hasNextPage: true,
        startCursor: 'start',
        endCursor: 'end',
      },
      edges: [
        { cursor: 'one', edgeProperty: 'extra one', node: ok({ foo: 'first' }) },
        { cursor: 'two', edgeProperty: 'extra two', node: notOk.BadRequest('Failed') },
      ],
    };
    const asJson = JSON.parse(JSON.stringify(expected)) as JsonConnection<JsonCustomEdge>;
    const converted = convertJsonConnection(asJson, convertCustomJsonEdge);
    expect(converted).toEqual(expected);
  });
});

describe('convertJsonResult()', () => {
  test('ok', () => {
    const expected = ok({ foo: 123 });
    const asJson = JSON.parse(JSON.stringify(expected)) as JsonResult<{ foo: number }, ErrorType>;
    const converted = convertJsonResult(asJson);
    if (expectOkResult(converted)) {
      expect(converted).toEqual(expected);
    }
  });

  test('ok(null)', () => {
    const expected = ok(null);
    const asJson = JSON.parse(JSON.stringify(expected)) as JsonResult<null, ErrorType>;
    const converted = convertJsonResult(asJson);
    if (expectOkResult(converted)) {
      expect(converted).toEqual(expected);
    }
  });

  test('notOk', () => {
    const expected = notOk.NotAuthenticated('Error message');
    const asJson = JSON.parse(JSON.stringify(expected)) as JsonResult<{ foo: number }, ErrorType>;
    const converted = convertJsonResult(asJson);
    expectErrorResult(converted, ErrorType.NotAuthenticated, 'Error message');
  });
});

describe('convertJsonEntityVersion()', () => {
  test('History with one version', () => {
    const expected: EntityHistory = {
      id: '123',
      versions: [{ createdAt: new Date(), createdBy: '4321', published: true, version: 0 }],
    };
    const asJson = JSON.parse(JSON.stringify(expected)) as JsonEntityHistory;
    const converted = convertJsonEntityHistory(asJson);
    expect(converted).toEqual(expected);

    expect(converted.versions[0].createdAt).toBeInstanceOf(Date);
  });
});

describe('convertJsonPublishingHistory()', () => {
  test('History with one version', () => {
    const expected: PublishingHistory = {
      id: '123',
      events: [
        {
          kind: PublishingEventKind.publish,
          publishedAt: new Date(),
          publishedBy: '4321',
          version: 0,
        },
      ],
    };
    const asJson = JSON.parse(JSON.stringify(expected)) as JsonPublishingHistory;
    const converted = convertJsonPublishingHistory(asJson);
    expect(converted).toEqual(expected);

    expect(converted.events[0].publishedAt).toBeInstanceOf(Date);
  });
});
