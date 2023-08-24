import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  graphqlSync,
} from 'graphql';
import { describe, expect, test } from 'vitest';
import { getRequestedChildFields } from './getRequestedChildFields.js';

const gql = String.raw;

const NestedType = new GraphQLObjectType({
  name: 'NestedType',
  fields: {
    a: { type: GraphQLString },
    b: { type: GraphQLString },
    c: { type: GraphQLString },
    requested: { type: new GraphQLNonNull(new GraphQLList(GraphQLString)) },
  },
});
const TopType = new GraphQLObjectType({
  name: 'TopType',
  fields: {
    a: { type: GraphQLString },
    b: { type: GraphQLString },
    c: { type: GraphQLString },
    nested: {
      type: NestedType,
      resolve: (_source, _args, _context, info) => {
        return { a: 'a', b: 'b', c: 'c', requested: [...getRequestedChildFields(info)].sort() };
      },
    },
    requested: { type: new GraphQLNonNull(new GraphQLList(GraphQLString)) },
  },
});
const Query = new GraphQLObjectType({
  name: 'Query',
  fields: {
    top: {
      type: TopType,
      resolve: (_source, _args, _context, info) => {
        return { a: 'a', b: 'b', c: 'c', requested: [...getRequestedChildFields(info)].sort() };
      },
    },
  },
});
const Schema = new GraphQLSchema({
  query: Query,
  types: [Query, TopType, NestedType],
});

function runQuery(source: string, variableValues?: Record<string, unknown>) {
  return graphqlSync({ schema: Schema, source: source, variableValues });
}

describe('getRequestedChildFields', () => {
  test('only self', () => {
    expect(
      runQuery(gql`
        {
          top {
            requested
          }
        }
      `),
    ).toEqual({ data: { top: { requested: ['requested'] } } });
  });

  test('__typename', () => {
    // N.B. __typename isn't included in the requested fields
    expect(
      runQuery(gql`
        {
          top {
            __typename
            requested
          }
        }
      `),
    ).toEqual({ data: { top: { __typename: 'TopType', requested: ['requested'] } } });
  });

  test('alias one field', () => {
    expect(
      runQuery(gql`
        {
          top {
            aliasA: a
            requested
          }
        }
      `),
    ).toEqual({ data: { top: { aliasA: 'a', requested: ['a', 'requested'] } } });
  });

  test('skip true on one field, skip false on another', () => {
    expect(
      runQuery(
        gql`
          query ($skipA: Boolean!, $skipB: Boolean!) {
            top {
              a @skip(if: $skipA)
              b @skip(if: $skipB)
              requested
            }
          }
        `,
        { skipA: true, skipB: false },
      ),
    ).toEqual({ data: { top: { b: 'b', requested: ['b', 'requested'] } } });
  });

  test('include true on one field, include false on another', () => {
    expect(
      runQuery(
        gql`
          query ($includeA: Boolean!, $includeB: Boolean!) {
            top {
              a @include(if: $includeA)
              b @include(if: $includeB)
              requested
            }
          }
        `,
        { includeA: true, includeB: false },
      ),
    ).toEqual({ data: { top: { a: 'a', requested: ['a', 'requested'] } } });
  });

  test('field used by fragment', () => {
    expect(
      runQuery(gql`
        query {
          top {
            ...CFragment
            requested
          }
        }

        fragment CFragment on TopType {
          c
        }
      `),
    ).toEqual({ data: { top: { c: 'c', requested: ['c', 'requested'] } } });
  });

  test('field used by inline fragment', () => {
    expect(
      runQuery(gql`
        query {
          top {
            ... on TopType {
              b
            }
            requested
          }
        }
      `),
    ).toEqual({ data: { top: { b: 'b', requested: ['b', 'requested'] } } });
  });

  test('nested type', () => {
    expect(
      runQuery(gql`
        query {
          top {
            nested {
              a
              c
              requested
            }
            requested
          }
        }
      `),
    ).toEqual({
      data: {
        top: {
          nested: { a: 'a', c: 'c', requested: ['a', 'c', 'requested'] },
          requested: ['nested', 'requested'],
        },
      },
    });
  });
});
