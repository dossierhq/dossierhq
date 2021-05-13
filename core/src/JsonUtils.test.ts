import type {
  AdminEntityHistory,
  Connection,
  Edge,
  JsonAdminEntityHistory,
  JsonConnection,
  JsonEdge,
  JsonPublishHistory,
  JsonResult,
  PublishHistory,
} from '.';
import {
  convertJsonConnection,
  convertJsonEdge,
  convertJsonEntityVersion,
  convertJsonPublishHistory,
  convertJsonResult,
  ErrorType,
  notOk,
  ok,
} from '.';
import { expectErrorResult, expectOkResult } from './CoreTestUtils';

interface CustomEdge extends Edge<{ foo: string }, ErrorType> {
  edgeProperty: string;
}

interface JsonCustomEdge extends JsonEdge<{ foo: string }, ErrorType> {
  edgeProperty: string;
}

function convertCustomJsonEdge(jsonEdge: JsonCustomEdge): CustomEdge {
  return {
    ...convertJsonEdge(jsonEdge),
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
    const asJson: JsonConnection<JsonEdge<{ foo: string }, ErrorType>> = JSON.parse(
      JSON.stringify(expected)
    );
    const converted = convertJsonConnection(asJson, convertJsonEdge);
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
    const asJson: JsonConnection<JsonCustomEdge> = JSON.parse(JSON.stringify(expected));
    const converted = convertJsonConnection(asJson, convertCustomJsonEdge);
    expect(converted).toEqual(expected);
  });
});

describe('convertJsonResult()', () => {
  test('ok', () => {
    const expected = ok({ foo: 123 });
    const asJson: JsonResult<{ foo: number }, ErrorType> = JSON.parse(JSON.stringify(expected));
    const converted = convertJsonResult(asJson);
    if (expectOkResult(converted)) {
      expect(converted).toEqual(expected);
    }
  });

  test('notOk', () => {
    const expected = notOk.NotAuthenticated('Error message');
    const asJson: JsonResult<{ foo: number }, ErrorType> = JSON.parse(JSON.stringify(expected));
    const converted = convertJsonResult(asJson);
    expectErrorResult(converted, ErrorType.NotAuthenticated, 'Error message');
  });
});

describe('convertJsonEntityVersion()', () => {
  test('History with one version', () => {
    const expected: AdminEntityHistory = {
      id: '123',
      versions: [
        { createdAt: new Date(), createdBy: '4321', deleted: false, published: true, version: 0 },
      ],
    };
    const asJson: JsonAdminEntityHistory = JSON.parse(JSON.stringify(expected));
    const converted = convertJsonEntityVersion(asJson);
    expect(converted).toEqual(expected);

    expect(converted.versions[0].createdAt).toBeInstanceOf(Date);
  });
});

describe('convertJsonPublishHistory()', () => {
  test('History with one version', () => {
    const expected: PublishHistory = {
      id: '123',
      events: [{ publishedAt: new Date(), publishedBy: '4321', version: 0 }],
    };
    const asJson: JsonPublishHistory = JSON.parse(JSON.stringify(expected));
    const converted = convertJsonPublishHistory(asJson);
    expect(converted).toEqual(expected);

    expect(converted.events[0].publishedAt).toBeInstanceOf(Date);
  });
});
