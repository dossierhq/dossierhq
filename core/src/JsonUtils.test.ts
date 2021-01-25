import type { Connection, Edge, JsonConnection, JsonEdge, JsonResult } from '.';
import { convertJsonConnection, convertJsonEdge, convertJsonResult, ErrorType, notOk, ok } from '.';
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
