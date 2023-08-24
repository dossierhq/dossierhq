import type { ChangelogEventQuery, EventType } from '@dossierhq/core';
import { graphql, type ExecutionResult, type GraphQLSchema } from 'graphql';
import type { SessionGraphQLContext } from '../../GraphQLSchemaGenerator.js';

const gql = String.raw;

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Variables = {
  query?: ChangelogEventQuery | null;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Payload = {
  changelogEvents: {
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
    totalCount: number;
    edges: {
      cursor: string;
      node: {
        type: keyof typeof EventType;
        createdBy: string;
        createdAt: string;
        version?: number;
        entities?: {
          id: string;
          version: number;
          type: string;
          name: string;
        }[];
        unauthorizedEntityCount?: number;
      };
    }[];
  };
};

const QUERY = gql`
  query ChangelogEvents($query: ChangelogEventQueryInput) {
    changelogEvents(query: $query) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
      edges {
        cursor
        node {
          type
          createdBy
          createdAt
          ... on SchemaChangelogEvent {
            version
          }
          ... on EntityChangelogEvent {
            entities {
              id
              version
              type
              name
            }
            unauthorizedEntityCount
          }
        }
      }
    }
  }
`;

export function globalChangelogEvents(
  schema: GraphQLSchema,
  contextValue: SessionGraphQLContext,
  variableValues: Variables,
): Promise<ExecutionResult<Payload>> {
  return graphql({ schema, source: QUERY, contextValue, variableValues }) as Promise<
    ExecutionResult<Payload>
  >;
}
