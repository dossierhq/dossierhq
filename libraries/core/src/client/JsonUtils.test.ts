import { describe, expect, test } from 'vitest';
import { ErrorType, notOk, ok } from '../ErrorResult.js';
import type { Connection, Edge } from '../Types.js';
import { expectErrorResult, expectOkResult } from '../test/CoreTestUtils.js';
import type { JsonConnection, JsonEdge, JsonResult, JsonSyncEvent } from './JsonUtils.js';
import {
  convertJsonConnection,
  convertJsonEdge,
  convertJsonResult,
  convertJsonSyncEvent,
} from './JsonUtils.js';
import { AdminSchemaWithMigrations, EventType, type UpdateSchemaSyncEvent } from '../index.js';

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

describe('convertJsonSyncEvent()', () => {
  test('updateSchema', () => {
    const schema = AdminSchemaWithMigrations.createAndValidate({}).valueOrThrow();

    const event: UpdateSchemaSyncEvent = {
      id: '4-5-6-7',
      type: EventType.updateSchema,
      createdAt: new Date(),
      createdBy: '1-2-3-4',
      schemaSpecification: schema.spec,
    };
    const jsonEvent = JSON.parse(JSON.stringify(event)) as JsonSyncEvent;
    expect(convertJsonSyncEvent(jsonEvent)).toEqual(event);
  });
});
